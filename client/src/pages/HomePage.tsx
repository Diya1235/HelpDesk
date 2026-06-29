import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Inbox, AlertCircle, Bot, Zap, Clock } from "lucide-react";
import { Navbar } from "../components/Navbar";

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  aiResolvedCount: number;
  aiResolvedPercent: number;
  avgResolutionMinutes: number | null;
}

interface DailyCount {
  date: string;
  count: number;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

type LucideIcon = React.ComponentType<{ className?: string }>;

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon?: LucideIcon }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm px-5 py-4 flex flex-col gap-1 min-w-0">
      {Icon && <Icon className="h-4 w-4 text-primary mb-0.5" />}
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">{label}</span>
      <span className="text-2xl font-bold text-foreground mt-0.5">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function BarChart({ data }: { data: DailyCount[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const chartH = 140;
  const barW = 14;
  const gap = 4;
  const labelStep = 7;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6">
      <h2 className="text-sm font-semibold text-muted-foreground mb-4">Tickets per day — last 30 days</h2>
      <svg
        viewBox={`0 0 ${totalW} ${chartH + 24}`}
        className="w-full overflow-visible"
        preserveAspectRatio="none"
        style={{ height: chartH + 24 }}
      >
        {data.map((d, i) => {
          const barH = Math.max((d.count / max) * chartH, d.count > 0 ? 2 : 0);
          const x = i * (barW + gap);
          const y = chartH - barH;
          const showLabel = i % labelStep === 0 || i === data.length - 1;
          const labelDate = new Date(d.date + "T00:00:00");
          const label = `${labelDate.getMonth() + 1}/${labelDate.getDate()}`;
          return (
            <g key={d.date}>
              <title>{`${d.date}: ${d.count} ticket${d.count !== 1 ? "s" : ""}`}</title>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={2}
                style={{ fill: "var(--primary)" }}
                opacity={0.85}
              />
              {showLabel && (
                <text
                  x={x + barW / 2}
                  y={chartH + 16}
                  textAnchor="middle"
                  fontSize={9}
                  fontFamily="sans-serif"
                  style={{ fill: "var(--muted-foreground)" }}
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}
        <line x1={0} y1={chartH} x2={totalW} y2={chartH} strokeWidth={1} style={{ stroke: "var(--border)" }} />
      </svg>
    </div>
  );
}

export function HomePage() {
  const { data: stats, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ["ticket-stats"],
    queryFn: () => axios.get<DashboardStats>("/api/tickets/stats").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: daily = [] } = useQuery<DailyCount[]>({
    queryKey: ["ticket-daily"],
    queryFn: () => axios.get<DailyCount[]>("/api/tickets/daily").then((r) => r.data),
    refetchInterval: 60_000,
  });

  const loading = isLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground mb-6">Live ticket metrics</p>

        {isError && <p className="text-sm text-red-500 mb-4">Failed to load stats.</p>}

        <div className="grid grid-cols-5 gap-3 mb-6">
          <StatCard icon={Inbox} label="Total tickets" value={loading ? "—" : String(stats!.totalTickets)} />
          <StatCard icon={AlertCircle} label="Open tickets" value={loading ? "—" : String(stats!.openTickets)} sub="status = Open" />
          <StatCard icon={Bot} label="AI resolved" value={loading ? "—" : String(stats!.aiResolvedCount)} sub="no agent reply" />
          <StatCard
            icon={Zap}
            label="AI rate"
            value={loading ? "—" : `${stats!.aiResolvedPercent.toFixed(1)}%`}
            sub="of all tickets"
          />
          <StatCard
            icon={Clock}
            label="Avg resolution"
            value={
              loading
                ? "—"
                : stats!.avgResolutionMinutes == null
                ? "N/A"
                : formatDuration(stats!.avgResolutionMinutes)
            }
            sub="resolved tickets"
          />
        </div>

        {daily.length > 0 && <BarChart data={daily} />}
      </main>
    </div>
  );
}
