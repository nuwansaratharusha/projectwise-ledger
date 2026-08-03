import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  useProjects,
  useClients,
  useTransactions,
  useMilestones,
  useActivity,
  useProfile,
} from "@/hooks/use-data";
import { CURRENCIES } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, MetricCard, EmptyState, ErrorState, LoadingRows } from "@/components/common";
import {
  ProjectStatusBadge,
  PriorityBadge,
  TypeBadge,
  TransactionStatusBadge,
  MilestoneStatusBadge,
} from "@/components/status-badges";
import {
  computeDashboardTotals,
  projectsNeedingAttention,
  computeFinancials,
  computeProgress,
  isProjectOverdue,
  isTransactionOverdue,
} from "@/lib/finance";
import { formatCurrency, formatDate, relativeDayLabel } from "@/lib/format";
import { Warning, CalendarCheck, Clock, ArrowUpRight, CheckCircle } from "@phosphor-icons/react";
import { SampleDataLoader } from "@/components/sample-data";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data: projects, isLoading: loadingP, error: errorP } = useProjects();
  const { data: clients = [] } = useClients();
  const { data: transactions, isLoading: loadingT, error: errorT } = useTransactions();
  const { data: milestones = [] } = useMilestones();
  const { data: activity = [] } = useActivity(undefined, 10);
  const { data: profile } = useProfile();
  const defaultCurrency = profile?.default_currency ?? "USD";

  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    if (profile?.default_currency) {
      setSelectedCurrency(profile.default_currency);
    }
  }, [profile?.default_currency]);

  const loading = loadingP || loadingT;
  const error = errorP || errorT;

  const totals = useMemo(
    () => computeDashboardTotals(projects ?? [], transactions ?? [], selectedCurrency),
    [projects, transactions, selectedCurrency],
  );

  const attention = useMemo(
    () => projectsNeedingAttention(projects ?? [], transactions ?? []),
    [projects, transactions],
  );

  const upcomingDeadlines = useMemo(() => {
    if (!projects) return [];
    const now = new Date();
    const twoWeeks = new Date(now.getTime() + 14 * 86_400_000);
    return projects
      .filter(
        (p) =>
          p.target_date &&
          p.status !== "completed" &&
          p.status !== "archived" &&
          new Date(p.target_date) <= twoWeeks &&
          new Date(p.target_date) >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.target_date!).getTime() - new Date(b.target_date!).getTime(),
      )
      .slice(0, 5);
  }, [projects]);

  const overduePayments = useMemo(
    () => (transactions ?? []).filter(isTransactionOverdue).slice(0, 5),
    [transactions],
  );

  const recentTransactions = useMemo(
    () =>
      (transactions ?? [])
        .filter((t) => t.status === "completed")
        .slice(0, 8),
    [transactions],
  );

  const recentMilestones = useMemo(
    () =>
      milestones
        .filter((m) => m.status === "done")
        .sort(
          (a, b) =>
            new Date(b.completed_at ?? b.updated_at).getTime() -
            new Date(a.completed_at ?? a.updated_at).getTime(),
        )
        .slice(0, 5),
    [milestones],
  );

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    clients.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [clients]);

  const projectMap = useMemo(() => {
    const m = new Map<string, string>();
    (projects ?? []).forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projects]);

  if (error) return <ErrorState message="Failed to load dashboard data." />;

  const hasProjects = (projects ?? []).length > 0;

  return (
    <div className="space-y-5">
      <PageHeader 
        title="Dashboard" 
        description="Overview of your projects and finances." 
        actions={
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">View Currency:</span>
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="h-7 w-[85px] text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-xs font-medium">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {loading ? (
        <LoadingRows rows={6} />
      ) : !hasProjects ? (
        <div className="space-y-4">
          <EmptyState
            title="No projects yet"
            description="Create your first project to start tracking progress and money."
          />
          <SampleDataLoader />
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <MetricCard
              label="Outstanding Receivables"
              value={formatCurrency(totals.outstandingReceivables, selectedCurrency)}
              tone={totals.outstandingReceivables > 0 ? "warning" : "default"}
            />
            <MetricCard
              label="Collected This Month"
              value={formatCurrency(totals.collectedThisMonth, selectedCurrency)}
              tone="success"
            />
            <MetricCard
              label="Active Client Projects"
              value={totals.activeClientProjects}
            />
            <MetricCard
              label="Active Investments"
              value={totals.activeInvestmentProjects}
            />
            <MetricCard
              label="Overdue Items"
              value={totals.overdueItems}
              tone={totals.overdueItems > 0 ? "danger" : "default"}
            />
            <MetricCard
              label="Investment Spent"
              value={formatCurrency(totals.investmentSpent, selectedCurrency)}
            />
          </div>

          {/* Sections */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Attention */}
            {attention.length > 0 && (
              <Section
                title="Requires Attention"
                icon={<Warning className="h-4 w-4 text-warning" weight="duotone" />}
              >
                <ul className="space-y-2">
                  {attention.slice(0, 6).map((a) => (
                    <li
                      key={a.project.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {a.project.name}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {a.reasons.map((r) => (
                            <span
                              key={r}
                              className="inline-block rounded bg-warning/10 px-1.5 py-0.5 text-xs text-warning"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <TypeBadge type={a.project.project_type} />
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Upcoming deadlines */}
            {upcomingDeadlines.length > 0 && (
              <Section
                title="Upcoming Deadlines"
                icon={<CalendarCheck className="h-4 w-4 text-info" weight="duotone" />}
              >
                <ul className="space-y-2">
                  {upcomingDeadlines.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(p.target_date)}
                          {relativeDayLabel(p.target_date) ? (
                            <span className="ml-1.5 text-info">
                              · {relativeDayLabel(p.target_date)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <ProjectStatusBadge status={p.status} />
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Overdue payments */}
            {overduePayments.length > 0 && (
              <Section
                title="Overdue Payments"
                icon={<Clock className="h-4 w-4 text-destructive" />}
              >
                <ul className="space-y-2">
                  {overduePayments.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {projectMap.get(t.project_id) ?? "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expected {formatDate(t.expected_date ?? t.transaction_date)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-destructive">
                        {formatCurrency(t.amount, t.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Recent transactions */}
            {recentTransactions.length > 0 && (
              <Section
                title="Recent Transactions"
                icon={<ArrowUpRight className="h-4 w-4 text-success" />}
              >
                <ul className="space-y-1.5">
                  {recentTransactions.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">
                          {projectMap.get(t.project_id) ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.category} · {formatDate(t.transaction_date)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium tabular-nums ${t.transaction_type === "income" ? "text-success" : "text-foreground"}`}
                      >
                        {t.transaction_type === "income" ? "+" : "−"}
                        {formatCurrency(t.amount, t.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Recent milestones */}
            {recentMilestones.length > 0 && (
              <Section
                title="Completed Milestones"
                icon={<CheckCircle className="h-4 w-4 text-success" weight="duotone" />}
              >
                <ul className="space-y-1.5">
                  {recentMilestones.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between rounded-lg p-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {projectMap.get(m.project_id) ?? "—"} ·{" "}
                          {formatDate(m.completed_at ?? m.updated_at)}
                        </p>
                      </div>
                      <MilestoneStatusBadge status={m.status} />
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {/* Recent activity */}
            {activity.length > 0 && (
              <Section title="Recent Activity" icon={<Clock className="h-4 w-4 text-muted-foreground" />}>
                <ul className="space-y-1.5">
                  {activity.map((a) => (
                    <li key={a.id} className="rounded-lg p-2">
                      <p className="text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.description ? `${a.description} · ` : ""}
                        {formatDate(a.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        {icon}
        <h2 className="text-[13px] font-semibold">{title}</h2>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
