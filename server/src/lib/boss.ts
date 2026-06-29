import { PgBoss } from "pg-boss";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { db } from "../db";
import { Category, TicketStatus, SenderType } from "../generated/prisma";
import { knowledgeBase } from "./knowledge-base";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const VALID_CATEGORIES = new Set(Object.values(Category));

export const CLASSIFY_JOB = "classify-ticket";

export interface ClassifyTicketData {
  ticketId: number;
  subject: string;
  body: string;
}

export const boss = new PgBoss({ connectionString: process.env.DATABASE_URL! });

boss.on("error", (err) => console.error("[pg-boss error]", err));

// --- AI system user ---
const AI_USER_EMAIL = "ai@helpdesk.internal";
let aiUserId: string | null = null;

async function getOrCreateAIUser(): Promise<string> {
  const existing = await db.user.findUnique({ where: { email: AI_USER_EMAIL } });
  if (existing) return existing.id;

  const created = await db.user.create({
    data: {
      id: crypto.randomUUID(),
      email: AI_USER_EMAIL,
      name: "AI Assistant",
      emailVerified: true,
      role: "agent",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log(`[boss] Created AI system user (id=${created.id})`);
  return created.id;
}

// --- Classification ---
async function classifyTicket(subject: string, body: string): Promise<Category> {
  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are a support ticket classifier. Classify the ticket into exactly one of these categories:
- GeneralQuestion: general inquiries, account questions, billing questions, how-to questions
- TechnicalQuestion: bugs, errors, crashes, integration problems, broken features
- RefundRequest: refund or payment reversal requests

Reply with ONLY the category name — no punctuation, no explanation.`,
    prompt: `Subject: ${subject}\n\n${body}`,
  });

  const category = text.trim() as Category;
  if (!VALID_CATEGORIES.has(category)) {
    throw new Error(`Unexpected category from AI: "${category}"`);
  }
  return category;
}

// --- Knowledge base check + reply generation ---
interface KbResult {
  matched: boolean;
  reply: string | null;
}

async function checkKnowledgeBase(
  firstName: string,
  subject: string,
  body: string,
): Promise<KbResult> {
  if (knowledgeBase.length === 0) return { matched: false, reply: null };

  const kbText = knowledgeBase
    .map((e, i) => `${i + 1}. Topic: ${e.topic}\n   Answer: ${e.answer}`)
    .join("\n\n");

  const { text } = await generateText({
    model: groq("llama-3.3-70b-versatile"),
    system: `You are an automated customer support system. Given a support ticket and a knowledge base, determine if the knowledge base has a clear and complete answer to the customer's question.

Knowledge base:
${kbText}

If the knowledge base clearly answers this ticket, write a friendly, professional reply to the customer:
- Open with "Hi ${firstName},"
- Be warm, concise, and helpful
- Use the knowledge base answer accurately — do not invent information
- Close with a blank line then: "Best regards,\\nSupport Team"

Respond with valid JSON only:
{"matched": true, "reply": "<the full reply>"}

If the knowledge base does NOT clearly answer the ticket:
{"matched": false, "reply": null}`,
    prompt: `Subject: ${subject}\n\nMessage: ${body}`,
  });

  try {
    const clean = text.trim().replace(/^```json\s*|```$/g, "").trim();
    return JSON.parse(clean) as KbResult;
  } catch {
    console.warn(`[auto-resolve] Could not parse KB result, skipping:`, text.slice(0, 120));
    return { matched: false, reply: null };
  }
}

// --- Boss startup ---
export async function startBoss(): Promise<void> {
  aiUserId = await getOrCreateAIUser();

  await boss.start();
  await boss.createQueue(CLASSIFY_JOB);

  boss.on("work-error", ({ err, job }: { err: Error; job: unknown }) => {
    console.error("[pg-boss work-error]", err.message, job);
  });

  await boss.work<ClassifyTicketData>(CLASSIFY_JOB, async ([job]) => {
    if (!job) return;
    const { ticketId, subject, body } = job.data;

    await db.ticket.update({
      where: { id: ticketId },
      data: { status: TicketStatus.Processing },
    });
    console.log(`[classify] ticket ${ticketId} → Processing`);

    try {
      const category = await classifyTicket(subject, body);
      await db.ticket.update({ where: { id: ticketId }, data: { category } });
      console.log(`[classify] ticket ${ticketId} categorised → ${category}`);

      const ticket = await db.ticket.findUnique({
        where: { id: ticketId },
        select: { fromName: true },
      });
      const firstName = (ticket?.fromName ?? "there").split(" ")[0];

      const kb = await checkKnowledgeBase(firstName, subject, body);

      if (kb.matched && kb.reply) {
        await db.reply.create({
          data: {
            body: kb.reply,
            senderType: SenderType.Agent,
            authorId: aiUserId!,
            ticketId,
          },
        });
        await db.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.Resolved },
        });
        console.log(`[auto-resolve] ticket ${ticketId} → Resolved (reply created)`);
      } else {
        await db.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.Open },
        });
        console.log(`[classify] ticket ${ticketId} → Open (needs agent)`);
      }
    } catch (err) {
      console.error(`[classify] ticket ${ticketId} failed, falling back to Open:`, err);
      await db.ticket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.Open },
      });
    }
  });

  console.log("[pg-boss] started, worker registered for:", CLASSIFY_JOB);
}
