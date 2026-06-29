import { categorySchema } from "@helpdesk/core";

type Category = (typeof categorySchema.options)[number];

const LABELS: Record<Category, string> = {
  GeneralQuestion: "General",
  TechnicalQuestion: "Technical",
  RefundRequest: "Refund",
};

const STYLES: Record<Category, string> = {
  GeneralQuestion: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  TechnicalQuestion: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  RefundRequest: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

interface Props {
  category: Category | null;
}

export function TicketCategory({ category }: Props) {
  if (!category || !categorySchema.options.includes(category)) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STYLES[category]}`}>
      {LABELS[category]}
    </span>
  );
}
