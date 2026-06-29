import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import axios from "axios";
import { agentTicketStatusSchema, categorySchema, type TicketStatus, type AgentTicketStatus, type Category } from "@helpdesk/core";

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

const AGENT_STATUS_LABELS: Record<AgentTicketStatus, string> = {
  Open: "Open",
  Resolved: "Resolved",
  Closed: "Closed",
};

const AI_STATUS_LABELS: Partial<Record<TicketStatus, string>> = {
  New: "New (queued)",
  Processing: "Processing…",
};

const AI_STATUS_STYLES: Partial<Record<TicketStatus, string>> = {
  New: "text-purple-700 bg-purple-50 border border-purple-200",
  Processing: "text-yellow-700 bg-yellow-50 border border-yellow-200 animate-pulse",
};

const CATEGORY_LABELS: Record<Category, string> = {
  GeneralQuestion: "General Question",
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
      {status === "New" || status === "Processing" ? (
        <div>
          <p className={LABEL_CLS}>Status</p>
          <span className={`inline-block w-full rounded-md px-2.5 py-1.5 text-xs font-medium ${AI_STATUS_STYLES[status]}`}>
            {AI_STATUS_LABELS[status]}
          </span>
        </div>
      ) : (
        <SideSelect
          label="Status"
          ariaLabel="Status"
          value={status}
          disabled={updateMutation.isPending}
          onChange={(v) => updateMutation.mutate({ status: v as AgentTicketStatus })}
        >
          {agentTicketStatusSchema.options.map((s) => (
            <option key={s} value={s}>{AGENT_STATUS_LABELS[s]}</option>
          ))}
        </SideSelect>
      )}

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
