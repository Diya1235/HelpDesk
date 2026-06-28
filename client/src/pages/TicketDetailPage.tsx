import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Skeleton } from "../components/ui/skeleton";
import { ticketStatusSchema, categorySchema } from "@helpdesk/core";

type TicketStatus = (typeof ticketStatusSchema.options)[number];
type Category = (typeof categorySchema.options)[number];

interface Agent {
  id: string;
  name: string;
}

interface TicketDetail {
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
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  Open: "Open",
  Resolved: "Resolved",
  Closed: "Closed",
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

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: ticket, isLoading, isError } = useQuery<TicketDetail>({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<TicketDetail>(`/api/tickets/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: () => axios.get<Agent[]>("/api/tickets/agents").then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status?: TicketStatus; category?: Category | null }) =>
      axios.patch<TicketDetail>(`/api/tickets/${id}`, data).then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(["ticket", id], updated);
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (assigneeId: string | null) =>
      axios
        .patch<TicketDetail>(`/api/tickets/${id}/assign`, { assigneeId })
        .then((r) => r.data),
    onSuccess: (updated) => {
      qc.setQueryData(["ticket", id], updated);
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to tickets
        </Link>

        {isLoading ? (
          <div className="flex gap-5 items-start">
            <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-full mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="w-40 shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm p-3 space-y-3">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-7 w-full rounded-md" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-full rounded-md" />
            </div>
          </div>
        ) : isError ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-sm text-red-500">
            Ticket not found or failed to load.
          </div>
        ) : ticket ? (
          <div className="flex gap-5 items-start">
            {/* Left: subject, metadata, message */}
            <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Subject */}
              <div className="px-6 py-5 border-b border-gray-100">
                <h1 className="text-xl font-semibold text-gray-900">{ticket.subject}</h1>
              </div>

              {/* From + dates */}
              <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-6 text-sm">
                <div>
                  <p className={LABEL_CLS}>From</p>
                  <p className="text-gray-800 font-medium">{ticket.fromName}</p>
                  <p className="text-xs text-gray-500">{ticket.fromEmail}</p>
                </div>
                <div>
                  <p className={LABEL_CLS}>Received</p>
                  <p className="text-gray-700">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className={LABEL_CLS}>Last Updated</p>
                  <p className="text-gray-700">{new Date(ticket.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Message */}
              <div className="px-6 py-5">
                <p className={`${LABEL_CLS} mb-2`}>Message</p>
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                  {ticket.bodyHtml ? (
                    <div
                      className="prose prose-sm max-w-none text-gray-700"
                      dangerouslySetInnerHTML={{ __html: ticket.bodyHtml }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                      {ticket.body}
                    </pre>
                  )}
                </div>
              </div>
            </div>

            {/* Right: dropdowns only */}
            <div className="w-40 shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm p-3 text-sm space-y-3">
              <SideSelect
                label="Status"
                ariaLabel="Status"
                value={ticket.status}
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
                value={ticket.category ?? ""}
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
                value={ticket.assignee?.id ?? ""}
                disabled={assignMutation.isPending}
                onChange={(v) => assignMutation.mutate(v || null)}
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </SideSelect>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
