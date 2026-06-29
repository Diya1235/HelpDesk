import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Bot,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Skeleton } from "../components/ui/skeleton";
import { TicketCategory } from "../components/TicketCategory";
import { ticketStatusSchema, agentTicketStatusSchema, categorySchema } from "@helpdesk/core";

type TicketStatus = (typeof ticketStatusSchema.options)[number];
type AgentTicketStatus = (typeof agentTicketStatusSchema.options)[number];
type Category = (typeof categorySchema.options)[number];

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

interface TicketsResponse {
  tickets: Ticket[];
  total: number;
}

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<TicketStatus, string> = {
  New: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  Processing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  Open: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  Resolved: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  Closed: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  New: "New",
  Processing: "Processing",
  Open: "Open",
  Resolved: "Resolved",
  Closed: "Closed",
};

const CATEGORY_LABELS: Record<Category, string> = {
  GeneralQuestion: "General Question",
  TechnicalQuestion: "Technical Question",
  RefundRequest: "Refund Request",
};

const columns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ getValue, row }) => (
      <Link
        to={`/tickets/${row.original.id}`}
        className="font-medium text-foreground hover:text-primary max-w-xs truncate block"
      >
        {getValue<string>()}
      </Link>
    ),
  },
  {
    accessorKey: "fromName",
    header: "Sender",
    cell: ({ row }) => (
      <div>
        <div className="text-foreground">{row.original.fromName}</div>
        <div className="text-xs text-muted-foreground">{row.original.fromEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue<TicketStatus>();
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ getValue }) => (
      <TicketCategory category={getValue<Category | null>()} />
    ),
  },
  {
    id: "assignee",
    accessorFn: (row) => row.assignee?.name ?? null,
    header: "Assigned To",
    cell: ({ getValue }) => {
      const name = getValue<string | null>();
      return name ? (
        <span className="text-muted-foreground">{name}</span>
      ) : (
        <span className="text-muted-foreground/40">Unassigned</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Received",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground tabular-nums">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ),
  },
];

const SELECT_CLS =
  "text-sm border border-input rounded-md px-2.5 py-1.5 text-foreground bg-background focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer";

export function TicketsPage() {
  const [view, setView] = useState<"all" | "auto-resolved">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentTicketStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "">("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  function handleSort(columnId: string) {
    if (sortBy === columnId) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnId);
      setSortOrder(columnId === "createdAt" ? "desc" : "asc");
    }
    setPage(1);
  }

  function switchView(next: "all" | "auto-resolved") {
    setView(next);
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setCategoryFilter("");
  }

  const isAutoResolved = view === "auto-resolved";

  const { data, isLoading, isError } = useQuery<TicketsResponse>({
    queryKey: [
      "tickets",
      view,
      sortBy,
      sortOrder,
      statusFilter,
      categoryFilter,
      debouncedSearch,
      page,
    ],
    queryFn: () => {
      const params: Record<string, string | number | boolean> = {
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortOrder,
      };
      if (isAutoResolved) {
        params.autoResolved = true;
      } else {
        if (statusFilter) params.status = statusFilter;
        if (categoryFilter) params.category = categoryFilter;
        if (debouncedSearch) params.search = debouncedSearch;
      }
      return axios
        .get<TicketsResponse>("/api/tickets", { params })
        .then((r) => r.data);
    },
  });

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  const table = useReactTable({
    data: tickets,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tickets</h1>
            {!isLoading && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {total} ticket{total !== 1 ? "s" : ""}
                {!isAutoResolved && (statusFilter || categoryFilter || debouncedSearch) && " (filtered)"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => switchView("all")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All tickets
            </button>
            <button
              onClick={() => switchView("auto-resolved")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "auto-resolved"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              Auto-resolved
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
          {/* Filter bar — hidden in auto-resolved view */}
          {!isAutoResolved && <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search messages…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as AgentTicketStatus | "");
                setPage(1);
              }}
              className={SELECT_CLS}
            >
              <option value="">All statuses</option>
              {agentTicketStatusSchema.options.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value as Category | "");
                setPage(1);
              }}
              className={SELECT_CLS}
            >
              <option value="">All categories</option>
              {categorySchema.options.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>}

          {/* Table */}
          {isLoading ? (
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {["w-48", "w-32", "w-16", "w-20", "w-24", "w-20"].map(
                    (w, i) => (
                      <th key={i} className="text-left px-4 py-3">
                        <Skeleton className={`h-4 ${w}`} />
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
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
            <div className="p-10 text-center text-sm text-red-500">
              Failed to load tickets.
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No tickets match your search.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const colId = header.column.id;
                      const isSorted = sortBy === colId;
                      return (
                        <th
                          key={header.id}
                          className="text-left px-4 py-3 font-medium text-muted-foreground select-none cursor-pointer hover:text-foreground whitespace-nowrap"
                          onClick={() => handleSort(colId)}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sortOrder === "asc" && isSorted ? (
                            <ChevronUp className="inline-block ml-1 h-3 w-3" />
                          ) : isSorted ? (
                            <ChevronDown className="inline-block ml-1 h-3 w-3" />
                          ) : (
                            <ChevronDown className="inline-block ml-1 h-3 w-3 opacity-20" />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {start}–{end} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center gap-1">
                      {i > 0 && p - (arr[i - 1] ?? 0) > 1 && (
                        <span className="px-1 text-muted-foreground text-xs">…</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`min-w-[28px] px-2 py-1 rounded text-xs font-medium transition-colors ${
                          p === page
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
