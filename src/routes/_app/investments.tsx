import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useProjects, useTransactions, useMilestones, useProfile } from "@/hooks/use-data";
import { PageHeader, MetricCard, EmptyState, ErrorState, LoadingRows, ProgressBar } from "@/components/common";
import { ProjectStatusBadge, PriorityBadge } from "@/components/status-badges";
import { computeFinancials, computeProgress } from "@/lib/finance";
import { formatCurrency, formatDate, relativeDayLabel } from "@/lib/format";
import { convertCurrency } from "@/lib/currency";
import { CURRENCIES } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WarningCircle } from "@phosphor-icons/react";

export const Route = createFileRoute("/_app/investments")({
  component: InvestmentsPage,
});

function InvestmentsPage() {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const { data: transactions = [] } = useTransactions();
  const { data: milestones = [] } = useMilestones();
  const { data: profile } = useProfile();
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    if (profile?.default_currency) {
      setSelectedCurrency(profile.default_currency);
    }
  }, [profile?.default_currency]);

  const investmentProjects = useMemo(
    () => (projects ?? []).filter((p) => p.project_type === "investment"),
    [projects],
  );

  const enriched = useMemo(
    () =>
      investmentProjects.map((p) => {
        const fin = computeFinancials(p, transactions);
        const pMilestones = milestones.filter((m) => m.project_id === p.id);
        const progress = computeProgress(pMilestones);
        return { project: p, fin, progress };
      }),
    [investmentProjects, transactions, milestones],
  );

  const metrics = useMemo(() => {
    let totalBudgets = 0;
    let totalSpent = 0;
    let overBudgetCount = 0;
    for (const e of enriched) {
      totalBudgets += convertCurrency(e.fin.investmentBudget, e.fin.currency, selectedCurrency);
      totalSpent += convertCurrency(e.fin.totalSpent, e.fin.currency, selectedCurrency);
      if (e.fin.overBudget) overBudgetCount++;
    }
    return {
      totalBudgets,
      totalSpent,
      remaining: totalBudgets - totalSpent,
      overBudgetCount,
      count: enriched.length,
    };
  }, [enriched, selectedCurrency]);

  if (error)
    return (
      <ErrorState
        message="Failed to load investment data."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Investments"
        description="Track internal projects, products, and initiatives."
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

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : enriched.length === 0 ? (
        <EmptyState
          title="No investment projects"
          description="Create an investment project to track internal spending."
        />
      ) : (
        <>
          {/* Metrics */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Total Budgets"
              value={formatCurrency(metrics.totalBudgets, selectedCurrency)}
            />
            <MetricCard
              label="Total Spent"
              value={formatCurrency(metrics.totalSpent, selectedCurrency)}
            />
            <MetricCard
              label="Remaining"
              value={formatCurrency(metrics.remaining, selectedCurrency)}
              tone={metrics.remaining < 0 ? "danger" : "success"}
            />
            <MetricCard
              label="Over Budget"
              value={metrics.overBudgetCount}
              tone={metrics.overBudgetCount > 0 ? "danger" : "default"}
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Usage</TableHead>
                  <TableHead>Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map((e) => (
                  <TableRow
                    key={e.project.id}
                    className={e.fin.overBudget ? "bg-destructive/5" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{e.project.name}</span>
                        {e.fin.overBudget && (
                          <WarningCircle className="h-3.5 w-3.5 text-destructive shrink-0" weight="duotone" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ProjectStatusBadge status={e.project.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={e.project.priority} />
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={e.progress} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div>{formatCurrency(e.fin.investmentBudget, e.fin.currency)}</div>
                      {e.fin.currency !== selectedCurrency && (
                        <div className="text-[11px] text-muted-foreground font-normal">
                          ({formatCurrency(convertCurrency(e.fin.investmentBudget, e.fin.currency, selectedCurrency), selectedCurrency)})
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div>{formatCurrency(e.fin.totalSpent, e.fin.currency)}</div>
                      {e.fin.currency !== selectedCurrency && (
                        <div className="text-[11px] text-muted-foreground font-normal">
                          ({formatCurrency(convertCurrency(e.fin.totalSpent, e.fin.currency, selectedCurrency), selectedCurrency)})
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div
                        className={
                          e.fin.remainingBudget < 0
                            ? "text-destructive font-medium"
                            : "text-success font-medium"
                        }
                      >
                        {formatCurrency(e.fin.remainingBudget, e.fin.currency)}
                      </div>
                      {e.fin.currency !== selectedCurrency && (
                        <div className="text-[11px] text-muted-foreground font-normal">
                          ({formatCurrency(convertCurrency(e.fin.remainingBudget, e.fin.currency, selectedCurrency), selectedCurrency)})
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${e.fin.overBudget ? "bg-destructive" : "bg-primary"}`}
                            style={{
                              width: `${Math.min(100, e.fin.budgetUsage)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {Math.round(e.fin.budgetUsage)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(e.project.target_date)}
                        {relativeDayLabel(e.project.target_date) && (
                          <p className="text-xs text-muted-foreground">
                            {relativeDayLabel(e.project.target_date)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
