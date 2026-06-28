import { categorySchema } from "@helpdesk/core";

type Category = (typeof categorySchema.options)[number];

const LABELS: Record<Category, string> = {
  GeneralQuestion: "General",
  TechnicalQuestion: "Technical",
  RefundRequest: "Refund",
};

const STYLES: Record<Category, string> = {
  GeneralQuestion: "bg-sky-100 text-sky-700",
  TechnicalQuestion: "bg-amber-100 text-amber-700",
  RefundRequest: "bg-rose-100 text-rose-700",
};

interface Props {
  category: Category | null;
}

export function TicketCategory({ category }: Props) {
  if (!category || !categorySchema.options.includes(category)) {
    return <span className="text-gray-300">—</span>;
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STYLES[category]}`}>
      {LABELS[category]}
    </span>
  );
}
