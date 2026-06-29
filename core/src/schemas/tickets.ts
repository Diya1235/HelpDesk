import { z } from "zod";

export const ticketStatusSchema = z.enum(["New", "Processing", "Open", "Resolved", "Closed"]);

export const agentTicketStatusSchema = z.enum(["Open", "Resolved", "Closed"]);

export const categorySchema = z.enum([
  "GeneralQuestion",
  "TechnicalQuestion",
  "RefundRequest",
]);
export const senderTypeSchema = z.enum(["Agent", "Customer"]);

export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type AgentTicketStatus = z.infer<typeof agentTicketStatusSchema>;
export type Category = z.infer<typeof categorySchema>;
export type SenderType = z.infer<typeof senderTypeSchema>;

export interface Reply {
  id: number;
  body: string;
  bodyHtml: string | null;
  senderType: SenderType;
  author: { id: string; name: string; role: string };
  createdAt: string;
}

export interface Ticket {
  id: number;
  subject: string;
  body: string;
  bodyHtml: string | null;
  fromEmail: string;
  fromName: string;
  status: TicketStatus;
  category: Category | null;
  assignee: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
}

export const assignTicketSchema = z.object({
  assigneeId: z.string().nullable(),
});

export const updateTicketSchema = z.object({
  status: agentTicketStatusSchema.optional(),
  category: categorySchema.nullable().optional(),
});

export const createReplySchema = z.object({
  body: z.string().min(1, "Reply cannot be empty").max(10000, "Reply cannot exceed 10,000 characters"),
  bodyHtml: z.string().nullable().optional(),
});
export type CreateReply = z.infer<typeof createReplySchema>;

// Accepts payloads from multiple inbound-email providers and normalises to a
// common shape.  Supported providers:
//   - SendGrid Inbound Parse: { from, subject, text, html }
//   - Cloudmailin JSON:       { headers.from, headers.subject, body.plain, body.html }
//   - Cloudmailin Original:   { headers.from, headers.subject, plain, html }
export const inboundEmailWebhookSchema = z
  .object({
    // SendGrid / generic flat format
    from: z.string().optional(),
    subject: z.string().optional(),
    text: z.string().optional(),
    html: z.string().optional(),
    // Cloudmailin: plain as alias for text
    plain: z.string().optional(),
    // Cloudmailin JSON: headers object carries from + subject
    headers: z
      .object({
        from: z.string().optional(),
        subject: z.string().optional(),
      })
      .passthrough()
      .optional(),
    // Cloudmailin JSON: body object carries plain + html
    body: z
      .object({
        plain: z.string().optional(),
        html: z.string().optional(),
      })
      .optional(),
  })
  .transform((d) => ({
    from: d.from ?? d.headers?.from ?? "",
    subject: d.subject ?? d.headers?.subject,
    text: d.text ?? d.plain ?? d.body?.plain,
    html: d.html ?? d.body?.html,
  }))
  .refine((d) => d.from.length > 0, { message: "from is required" });

export type InboundEmailWebhook = z.infer<typeof inboundEmailWebhookSchema>;
