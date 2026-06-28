import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import axios from "axios";
import { ticketStatusSchema, categorySchema, type TicketStatus, type Category } from "@helpdesk/core";

interface Agent {
  id: string;
  name: string;
}

interface Props {
  ticketId: string;
  status: TicketStatus;
  category: Category | null;
  assignee: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  Open: "Open",
  Resolved: "Resolved",
  Closed: "Closed",
};

const CATEGORY_LABELS: Record<Category, string> = {
  General: "General Question",
  TechnicalQuestion: "Technical Question",
  RefundRequest: "Refund Request",
};

const LABEL_CLS = "text-xs font-medium text-gray-500 mb-1";
const SELECT_CLS =
  "w-full appearance-none text-sm border border-gray-200 rounded-md pl-2.5 pr-7 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

function SideSelect({
  label,
  ariaLabel,
  value,
  disabled,
  onChange,
  children,
}: {
  label: string;
  ariaLabel: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className={LABEL_CLS}>{label}</p>
      <div className="relative">
        <select
          aria-label={ariaLabel}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={SELECT_CLS}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
      </div>
    </div>
  );
}

export function UpdateTicket({ ticketId, status, category, assignee }: Props) {
  const qc = useQueryClient();

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: () => axios.get<Agent[]>("/api/tickets/agents").then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status?: TicketStatus; category?: Category | null }) =>
      axios.patch(`/api/tickets/${ticketId}`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(["ticket", ticketId], updated);
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (assigneeId: string | null) =>
      axios.patch(`/api/tickets/${ticketId}/assign`, { assigneeId }).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(["ticket", ticketId], updated);
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  return (
    <div className="w-40 shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-sm space-y-3">
      <SideSelect
        label="Status"
        ariaLabel="Status"
        value={status}
        disabled={updateMutation.isPending}
        onChange={(v) => updateMutation.mutate({ status: v as TicketStatus })}
      >
        {ticketStatusSchema.options.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </SideSelect>

      <SideSelect
        label="Category"
        ariaLabel="Category"
        value={category ?? ""}
        disabled={updateMutation.isPending}
        onChange={(v) => updateMutation.mutate({ category: (v as Category) || null })}
      >
        <option value="">Uncategorised</option>
        {categorySchema.options.map((c) => (
          <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
        ))}
      </SideSelect>

      <SideSelect
        label="Assigned To"
        ariaLabel="Assigned To"
        value={assignee?.id ?? ""}
        disabled={assignMutation.isPending}
        onChange={(v) => assignMutation.mutate(v || null)}
      >
        <option value="">Unassigned</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </SideSelect>
    </div>
  );
}
