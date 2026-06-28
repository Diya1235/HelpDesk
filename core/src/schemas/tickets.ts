import { z } from "zod";

export const ticketStatusSchema = z.enum(["Open", "Resolved", "Closed"]);
export const categorySchema = z.enum([
  "GeneralQuestion",
  "TechnicalQuestion",
  "RefundRequest",
]);

export type TicketStatus = z.infer<typeof ticketStatusSchema>;
export type Category = z.infer<typeof categorySchema>;

export const inboundEmailWebhookSchema = z.object({
  from: z.string().min(1),
  to: z.union([z.string(), z.array(z.string())]).optional(),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
});

export type InboundEmailWebhook = z.infer<typeof inboundEmailWebhookSchema>;
