export interface KbEntry {
  topic: string;
  answer: string;
}

export const knowledgeBase: KbEntry[] = [
  {
    topic: "Password Reset",
    answer:
      "To reset your password, click 'Forgot Password' on the login page. You'll receive an email with a reset link within a few minutes. If you don't see it, check your spam folder.",
  },
  {
    topic: "Refund Policy",
    answer:
      "We offer full refunds within 30 days of purchase. To request a refund, please reply with your order number and the reason for the refund. Refunds are processed within 5–7 business days.",
  },
  {
    topic: "Business Hours",
    answer:
      "Our support team is available Monday through Friday, 9 AM to 6 PM EST. For urgent issues outside these hours, please mark your email as urgent and we'll respond within 24 hours.",
  },
  {
    topic: "Update Account Email",
    answer:
      "To update your account email, go to Account Settings → Profile → Edit Email. You'll need to verify the new address before the change takes effect. If you run into any trouble, let us know and we'll assist you.",
  },
  {
    topic: "Cancel Subscription",
    answer:
      "You can cancel your subscription at any time from Account Settings → Billing → Cancel Plan. Your access continues until the end of the current billing period. You won't be charged again after cancellation.",
  },
  {
    topic: "Download Invoice or Receipt",
    answer:
      "Invoices and receipts are available in Account Settings → Billing → Invoice History. Each entry has a Download PDF button. If a specific invoice is missing, reply with the transaction date and we'll send it to you directly.",
  },
];
