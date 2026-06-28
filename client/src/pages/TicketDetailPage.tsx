import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { TicketCategory } from "../components/TicketCategory";
import { Skeleton } from "../components/ui/skeleton";
import { ticketStatusSchema, categorySchema } from "@helpdesk/core";

type TicketStatus = (typeof ticketStatusSchema.options)[number];
type Category = (typeof categorySchema.options)[number];

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

const STATUS_STYLES: Record<TicketStatus, string> = {
  Open: "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-500",
};

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isLoading, isError } = useQuery<TicketDetail>({
    queryKey: ["ticket", id],
    queryFn: () => axios.get<TicketDetail>(`/api/tickets/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to tickets
        </Link>

        {isLoading ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4">
            <Skeleton className="h-7 w-2/3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="pt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : isError ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 text-center text-sm text-red-500">
            Ticket not found or failed to load.
          </div>
        ) : ticket ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <h1 className="text-xl font-semibold text-gray-900 mb-3">
                {ticket.subject}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
                >
                  {ticket.status}
                </span>
                <TicketCategory category={ticket.category} />
              </div>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">From</p>
                <p className="text-gray-800 font-medium">{ticket.fromName}</p>
                <p className="text-gray-500">{ticket.fromEmail}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Assigned To</p>
                {ticket.assignee ? (
                  <p className="text-gray-800">{ticket.assignee.name}</p>
                ) : (
                  <p className="text-gray-300">Unassigned</p>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Received</p>
                <p className="text-gray-700">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Last Updated</p>
                <p className="text-gray-700">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="px-6 py-5">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Message</p>
              {ticket.bodyHtml ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: ticket.bodyHtml }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {ticket.body}
                </pre>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
