import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { Skeleton } from "../components/ui/skeleton";
import { TicketCategory } from "../components/TicketCategory";

import type { Category } from "@helpdesk/core";

type TicketStatus = "Open" | "Resolved" | "Closed";

interface Ticket {
  id: number;
  subject: string;
  fromName: string;
  fromEmail: string;
  status: TicketStatus;
  category: Category | null;
  assignee: { id: string; name: string } | null;
  createdAt: string;
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  Open: "bg-blue-100 text-blue-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-500",
};

const headers = (
  <tr>
    <th className="text-left px-4 py-3 font-medium text-gray-500 w-12">#</th>
    <th className="text-left px-4 py-3 font-medium text-gray-500">Subject</th>
    <th className="text-left px-4 py-3 font-medium text-gray-500">From</th>
    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
    <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
    <th className="text-left px-4 py-3 font-medium text-gray-500">Assigned To</th>
    <th className="text-left px-4 py-3 font-medium text-gray-500">Received</th>
  </tr>
);

export function TicketsPage() {
  const { data: tickets = [], isLoading, isError } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: () => axios.get<Ticket[]>("/api/tickets").then((r) => r.data),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          {!isLoading && (
            <p className="mt-0.5 text-sm text-gray-400">
              {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          {isLoading ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">{headers}</thead>
              <tbody className="divide-y divide-gray-50">
                {Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-6" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : isError ? (
            <div className="p-10 text-center text-sm text-red-500">Failed to load tickets.</div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">No tickets yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">{headers}</thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 tabular-nums">{ticket.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">
                      {ticket.subject}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div>{ticket.fromName}</div>
                      <div className="text-xs text-gray-400">{ticket.fromEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TicketCategory category={ticket.category} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {ticket.assignee?.name ?? <span className="text-gray-300">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 tabular-nums">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
