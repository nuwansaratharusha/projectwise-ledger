import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  useTransactions,
  useProjects,
  useClients,
  useProfile,
} from "@/hooks/use-data";
import { convertCurrency } from "@/lib/currency";
import { CURRENCIES } from "@/lib/types";
import { PageHeader, MetricCard, EmptyState, ErrorState, LoadingRows } from "@/components/common";
import { TransactionStatusBadge } from "@/components/status-badges";
import { TransactionFormDialog } from "@/components/transaction-form";
import { isTransactionOverdue } from "@/lib/finance";
import { formatCurrency, formatDate, monthKey } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, DownloadSimple, X } from "@phosphor-icons/react";

export const Route = createFileRoute("/_app/payments")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const {
    data: transactions,
    isLoading,
    error,
    refetch,
  } = useTransactions();
  const { data: projects = [] } = useProjects();
  const { data: clients = [] } = useClients();
  const { data: profile } = useProfile();
  const defaultCurrency = profile?.default_currency ?? "USD";

  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    if (profile?.default_currency) {
      setSelectedCurrency(profile.default_currency);
    }
  }, [profile?.default_currency]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [formOpen, setFormOpen] = useState(false);

  const projectMap = useMemo(() => {
    const m = new Map<string, string>();
    projects.forEach((p) => m.set(p.id, p.name));
    return m;
  }, [projects]);

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    clients.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [clients]);

  // Only income transactions (payments) for client projects
  const payments = useMemo(() => {
    const clientProjectIds = new Set(
      projects
        .filter((p) => p.project_type === "client")
        .map((p) => p.id),
    );
    return (transactions ?? []).filter(
      (t) =>
        t.transaction_type === "income" &&
        clientProjectIds.has(t.project_id),
    );
  }, [transactions, projects]);

  const metrics = useMemo(() => {
    const nowMonth = monthKey(new Date().toISOString());
    let outstanding = 0;
    let receivedThisMonth = 0;
    let overdueCount = 0;
    for (const t of payments) {
      const convertedAmount = convertCurrency(t.amount, t.currency || "USD", selectedCurrency);
      if (t.status === "expected") {
        outstanding += convertedAmount;
        if (isTransactionOverdue(t)) overdueCount++;
      }
      if (
        t.status === "completed" &&
        monthKey(t.transaction_date) === nowMonth
      ) {
        receivedThisMonth += convertedAmount;
      }
    }
    return { outstanding, receivedThisMonth, overdueCount, total: payments.length };
  }, [payments, selectedCurrency]);

  const filtered = useMemo(() => {
    let list = payments;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          (projectMap.get(t.project_id) ?? "").toLowerCase().includes(q) ||
          (t.category?.toLowerCase().includes(q) ?? false) ||
          (t.notes?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filterStatus === "overdue") {
      list = list.filter(isTransactionOverdue);
    } else if (filterStatus !== "all") {
      list = list.filter((t) => t.status === filterStatus);
    }
    if (filterProject !== "all") {
      list = list.filter((t) => t.project_id === filterProject);
    }
    return list.sort(
      (a, b) =>
        new Date(b.transaction_date).getTime() -
        new Date(a.transaction_date).getTime(),
    );
  }, [payments, search, filterStatus, filterProject, projectMap]);

  const hasFilters = search || filterStatus !== "all" || filterProject !== "all";

  function exportCsv() {
    const rows = filtered.map((t) => ({
      Date: t.transaction_date,
      Project: projectMap.get(t.project_id) ?? "",
      Category: t.category,
      Amount: t.amount,
      Currency: t.currency,
      Status: t.status,
      "Payment Method": t.payment_method ?? "",
      Reference: t.reference_number ?? "",
      Notes: t.notes ?? "",
    }));
    downloadCsv("payments-export.csv", rows);
  }

  if (error)
    return (
      <ErrorState
        message="Failed to load payment data."
        onRetry={() => refetch()}
      />
    );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Track income from client projects."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
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
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              <DownloadSimple className="mr-1.5 h-3.5 w-3.5" weight="duotone" />
              CSV
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Record payment
            </Button>
          </div>
        }
      />

      {/* Metrics */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Outstanding"
          value={formatCurrency(metrics.outstanding, selectedCurrency)}
          tone={metrics.outstanding > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Received This Month"
          value={formatCurrency(metrics.receivedThisMonth, selectedCurrency)}
          tone="success"
        />
        <MetricCard
          label="Overdue"
          value={metrics.overdueCount}
          tone={metrics.overdueCount > 0 ? "danger" : "default"}
        />
        <MetricCard
          label="Total Payments"
          value={metrics.total}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search…"
          className="h-8 w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="expected">Expected</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="h-8 w-auto min-w-[140px] text-xs">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects
              .filter((p) => p.project_type === "client")
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            onClick={() => {
              setSearch("");
              setFilterStatus("all");
              setFilterProject("all");
            }}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingRows rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching payments" : "No payments yet"}
          description={
            hasFilters
              ? "Try adjusting your filters."
              : "Record a payment to start tracking."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Ref</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const overdue = isTransactionOverdue(t);
                return (
                  <TableRow
                    key={t.id}
                    className={overdue ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="text-sm">
                      {formatDate(t.transaction_date)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {projectMap.get(t.project_id) ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.category}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium tabular-nums text-success">
                      <div>+{formatCurrency(t.amount, t.currency)}</div>
                      {t.currency !== selectedCurrency && (
                        <div className="text-[11px] text-muted-foreground font-normal">
                          ({formatCurrency(convertCurrency(t.amount, t.currency, selectedCurrency), selectedCurrency)})
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <TransactionStatusBadge
                        status={t.status}
                        overdue={overdue}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.expected_date ? formatDate(t.expected_date) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.payment_method ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.reference_number ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultType="income"
      />
    </div>
  );
}
