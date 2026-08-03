import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/use-data";
import {
  useSaveTransaction,
  useUpdateTransactionStatus,
  useDeleteTransaction,
} from "@/hooks/use-mutations";
import { TransactionStatusBadge } from "@/components/status-badges";
import { EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TransactionFormDialog } from "@/components/transaction-form";
import { formatCurrency, formatDate } from "@/lib/format";
import { isTransactionOverdue, type ProjectFinancials } from "@/lib/finance";
import { Plus, PencilSimple, Trash, CheckCircle, XCircle } from "@phosphor-icons/react";
import type { Project, Transaction } from "@/lib/types";

export function MoneyTab({
  project,
  fin,
}: {
  project: Project;
  fin: ProjectFinancials;
}) {
  const { data: allTransactions = [] } = useTransactions();
  const updateStatus = useUpdateTransactionStatus();
  const deleteTx = useDeleteTransaction();

  const [formOpen, setFormOpen] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [defaultType, setDefaultType] = useState<"income" | "expense">("income");
  const [defaultStatus, setDefaultStatus] = useState<Transaction["status"]>("completed");

  const transactions = useMemo(
    () =>
      allTransactions
        .filter((t) => t.project_id === project.id)
        .sort(
          (a, b) =>
            new Date(b.transaction_date).getTime() -
            new Date(a.transaction_date).getTime(),
        ),
    [allTransactions, project.id],
  );

  function openForm(type: "income" | "expense", status: Transaction["status"] = "completed") {
    setDefaultType(type);
    setDefaultStatus(status);
    setEditTx(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Financial summary */}
      {fin.isClient ? (
        <div className="grid gap-3 sm:grid-cols-4">
          <SummaryCard
            label="Value"
            value={formatCurrency(fin.agreedValue, fin.currency)}
          />
          <SummaryCard
            label="Received"
            value={formatCurrency(fin.totalReceived, fin.currency)}
            className="text-success"
          />
          <SummaryCard
            label="Balance Due"
            value={formatCurrency(fin.balanceDue, fin.currency)}
            className={fin.balanceDue > 0 ? "text-warning" : ""}
          />
          <SummaryCard
            label="Payment %"
            value={`${Math.round(fin.paymentProgress)}%`}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Budget"
            value={formatCurrency(fin.investmentBudget, fin.currency)}
          />
          <SummaryCard
            label="Spent"
            value={formatCurrency(fin.totalSpent, fin.currency)}
            className={fin.overBudget ? "text-destructive" : ""}
          />
          <SummaryCard
            label="Remaining"
            value={formatCurrency(fin.remainingBudget, fin.currency)}
            className={fin.remainingBudget < 0 ? "text-destructive" : "text-success"}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {fin.isClient && (
          <>
            <Button size="sm" variant="outline" onClick={() => openForm("income")}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Record payment
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setDefaultType("income");
                setDefaultStatus("expected");
                setEditTx(null);
                setFormOpen(true);
              }}
            >
              Add expected payment
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" onClick={() => openForm("expense")}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Record expense
        </Button>
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions recorded yet"
          description="Record payments received or expenses paid for this project."
        />
      ) : (
        <ul className="space-y-2">
          {transactions.map((t) => {
            const overdue = isTransactionOverdue(t);
            return (
              <li
                key={t.id}
                className={`rounded-lg border p-3 ${overdue ? "border-destructive/20 bg-destructive/5" : "border-border"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium tabular-nums ${t.transaction_type === "income" ? "text-success" : ""}`}
                      >
                        {t.transaction_type === "income" ? "+" : "−"}
                        {formatCurrency(t.amount, t.currency)}
                      </span>
                      <TransactionStatusBadge
                        status={t.status}
                        overdue={overdue}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t.category} · {formatDate(t.transaction_date)}
                      {t.expected_date && t.status === "expected"
                        ? ` · Expected ${formatDate(t.expected_date)}`
                        : ""}
                    </p>
                    {t.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.notes}
                      </p>
                    )}
                    {t.payment_method && (
                      <p className="text-xs text-muted-foreground">
                        {t.payment_method}
                        {t.reference_number ? ` · ${t.reference_number}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {t.status === "expected" && (
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-success/10 text-success cursor-pointer"
                        onClick={() =>
                          updateStatus.mutate({
                            tx: t,
                            status: "completed",
                          })
                        }
                        aria-label="Mark completed"
                        title="Mark completed"
                      >
                        <CheckCircle className="h-3.5 w-3.5" weight="duotone" />
                      </button>
                    )}
                    {t.status === "expected" && (
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted cursor-pointer"
                        onClick={() =>
                          updateStatus.mutate({
                            tx: t,
                            status: "cancelled",
                          })
                        }
                        aria-label="Cancel transaction"
                        title="Cancel"
                      >
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-muted cursor-pointer"
                      onClick={() => {
                        setEditTx(t);
                        setFormOpen(true);
                      }}
                      aria-label="Edit transaction"
                    >
                      <PencilSimple className="h-3.5 w-3.5 text-muted-foreground" weight="duotone" />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                      onClick={() => setDeleteId(t.id)}
                      aria-label="Delete transaction"
                    >
                      <Trash className="h-3.5 w-3.5" weight="duotone" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditTx(null);
          }
        }}
        transaction={editTx}
        defaultProjectId={project.id}
        defaultType={defaultType}
        defaultStatus={defaultStatus}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteTx.mutate(deleteId);
                setDeleteId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${className ?? ""}`}>
        {value}
      </p>
    </div>
  );
}
