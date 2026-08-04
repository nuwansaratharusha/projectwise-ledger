import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  useProjects,
  useClients,
  useTransactions,
  useMilestones,
  useProfile,
} from "@/hooks/use-data";
import { PageHeader, ErrorState, LoadingRows } from "@/components/common";
import { computeFinancials } from "@/lib/finance";
import { formatCurrency, monthKey } from "@/lib/format";
import { convertCurrency } from "@/lib/currency";
import { CURRENCIES } from "@/lib/types";
import { downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DownloadSimple } from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const {
    data: projects,
    isLoading: loadingP,
    error: errorP,
  } = useProjects();
  const { data: clients = [] } = useClients();
  const {
    data: transactions,
    isLoading: loadingT,
    error: errorT,
  } = useTransactions();
  const { data: milestones = [] } = useMilestones();
  const { data: profile } = useProfile();
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    if (profile?.default_currency) {
      setSelectedCurrency(profile.default_currency);
    }
  }, [profile?.default_currency]);

  const loading = loadingP || loadingT;
  const error = errorP || errorT;

  // Default date range: last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const [fromDate, setFromDate] = useState(
    sixMonthsAgo.toISOString().slice(0, 10),
  );
  const [toDate, setToDate] = useState(now.toISOString().slice(0, 10));

  const filteredTransactions = useMemo(
    () =>
      (transactions ?? []).filter(
        (t) =>
          t.status === "completed" &&
          t.transaction_date >= fromDate &&
          t.transaction_date <= toDate,
      ),
    [transactions, fromDate, toDate],
  );

  // Monthly income vs expenses chart data
  const monthlyData = useMemo(() => {
    const map = new Map<string, { income: number; expenses: number }>();
    for (const t of filteredTransactions) {
      const key = monthKey(t.transaction_date);
      const entry = map.get(key) ?? { income: 0, expenses: 0 };
      const convertedAmount = convertCurrency(t.amount, t.currency || "USD", selectedCurrency);
      if (t.transaction_type === "income") {
        entry.income += convertedAmount;
      } else {
        entry.expenses += convertedAmount;
      }
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }, [filteredTransactions, selectedCurrency]);

  // Summary metrics
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpenses = 0;
    for (const t of filteredTransactions) {
      const convertedAmount = convertCurrency(t.amount, t.currency || "USD", selectedCurrency);
      if (t.transaction_type === "income") totalIncome += convertedAmount;
      else totalExpenses += convertedAmount;
    }
    const completedProjects = (projects ?? []).filter(
      (p) =>
        p.status === "completed" &&
        p.completed_at &&
        p.completed_at >= fromDate &&
        p.completed_at <= toDate,
    ).length;

    // Client breakdown
    const clientRevenue = new Map<string, number>();
    const clientProjectIds = new Map<string, string>();
    for (const p of projects ?? []) {
      if (p.client_id) clientProjectIds.set(p.id, p.client_id);
    }
    for (const t of filteredTransactions) {
      if (t.transaction_type !== "income") continue;
      const clientId = clientProjectIds.get(t.project_id);
      if (clientId) {
        const convertedAmount = convertCurrency(t.amount, t.currency || "USD", selectedCurrency);
        clientRevenue.set(
          clientId,
          (clientRevenue.get(clientId) ?? 0) + convertedAmount,
        );
      }
    }
    const clientBreakdown = Array.from(clientRevenue.entries())
      .map(([clientId, revenue]) => ({
        name:
          clients.find((c) => c.id === clientId)?.name ?? "Unknown",
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      completedProjects,
      clientBreakdown,
    };
  }, [filteredTransactions, projects, clients, fromDate, toDate, selectedCurrency]);

  function exportAll(type: "projects" | "clients" | "transactions" | "milestones") {
    if (type === "transactions") {
      const rows = filteredTransactions.map((t) => ({
        Date: t.transaction_date,
        Type: t.transaction_type,
        Category: t.category,
        Amount: t.amount,
        Currency: t.currency,
        Status: t.status,
        Method: t.payment_method ?? "",
        Reference: t.reference_number ?? "",
      }));
      downloadCsv("transactions-export.csv", rows);
    } else if (type === "projects") {
      const rows = (projects ?? []).map((p) => {
        const fin = computeFinancials(p, transactions ?? []);
        return {
          Name: p.name,
          Type: p.project_type,
          Status: p.status,
          Priority: p.priority,
          "Start Date": p.start_date ?? "",
          "Target Date": p.target_date ?? "",
          "Value": fin.isClient ? fin.agreedValue : "",
          Received: fin.isClient ? fin.totalReceived : "",
          Budget: !fin.isClient ? fin.investmentBudget : "",
          Spent: !fin.isClient ? fin.totalSpent : "",
        };
      });
      downloadCsv("projects-export.csv", rows);
    } else if (type === "clients") {
      const rows = clients.map((c) => ({
        Name: c.name,
        Company: c.company_name ?? "",
        Email: c.email ?? "",
        Phone: c.phone ?? "",
      }));
      downloadCsv("clients-export.csv", rows);
    } else {
      const rows = milestones.map((m) => ({
        Title: m.title,
        Status: m.status,
        "Due Date": m.due_date ?? "",
        Amount: m.billable_amount ?? "",
      }));
      downloadCsv("milestones-export.csv", rows);
    }
  }

  if (error) return <ErrorState message="Failed to load report data." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analyze your project finances."
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

      {/* Date range */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="rpt-from" className="text-xs">
            From
          </Label>
          <Input
            id="rpt-from"
            type="date"
            className="h-8 w-auto"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rpt-to" className="text-xs">
            To
          </Label>
          <Input
            id="rpt-to"
            type="date"
            className="h-8 w-auto"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingRows rows={4} />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Total Income"
              value={formatCurrency(summary.totalIncome, selectedCurrency)}
              className="text-success"
            />
            <SummaryCard
              label="Total Expenses"
              value={formatCurrency(summary.totalExpenses, selectedCurrency)}
            />
            <SummaryCard
              label="Net"
              value={formatCurrency(summary.net, selectedCurrency)}
              className={summary.net >= 0 ? "text-success" : "text-destructive"}
            />
            <SummaryCard
              label="Projects Completed"
              value={String(summary.completedProjects)}
            />
          </div>

          {/* Income vs Expenses chart */}
          {monthlyData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-4 text-sm font-semibold">
                Income vs Expenses by Month
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="month"
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    className="text-xs fill-muted-foreground"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => formatCurrency(value, selectedCurrency)}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="hsl(142, 71%, 45%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="hsl(0, 0%, 60%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Client revenue breakdown */}
          {summary.clientBreakdown.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">Revenue by Client</h2>
              <ul className="space-y-2">
                {summary.clientBreakdown.map((c) => {
                  const pct =
                    summary.totalIncome > 0
                      ? (c.revenue / summary.totalIncome) * 100
                      : 0;
                  return (
                    <li key={c.name} className="flex items-center gap-3">
                      <span className="w-32 truncate text-sm">{c.name}</span>
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-24 text-right text-sm tabular-nums">
                        {formatCurrency(c.revenue, selectedCurrency)}
                      </span>
                      <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                        {pct.toFixed(0)}%
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* CSV exports */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold">Data Exports</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAll("projects")}
              >
                <DownloadSimple className="mr-1.5 h-3.5 w-3.5" weight="duotone" />
                Projects CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAll("clients")}
              >
                <DownloadSimple className="mr-1.5 h-3.5 w-3.5" weight="duotone" />
                Clients CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAll("transactions")}
              >
                <DownloadSimple className="mr-1.5 h-3.5 w-3.5" weight="duotone" />
                Transactions CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportAll("milestones")}
              >
                <DownloadSimple className="mr-1.5 h-3.5 w-3.5" weight="duotone" />
                Milestones CSV
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${className ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}
