import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, EmptyState } from "@/components/common";
import {
  ProjectStatusBadge,
  TransactionStatusBadge,
} from "@/components/status-badges";
import { useProjects, useTransactions } from "@/hooks/use-data";
import { computeFinancials, isTransactionOverdue } from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/format";
import { PencilSimple, EnvelopeSimple, Phone, Globe, MapPin, Trash } from "@phosphor-icons/react";
import { useDeleteClient } from "@/hooks/use-mutations";
import type { Client } from "@/lib/types";

export function ClientDetailDrawer({
  client,
  open,
  onClose,
  onEdit,
}: {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onEdit: (c: Client) => void;
}) {
  const { data: projects = [] } = useProjects();
  const { data: transactions = [] } = useTransactions();
  const deleteClient = useDeleteClient();

  const clientProjects = useMemo(
    () =>
      client
        ? projects.filter((p) => p.client_id === client.id)
        : [],
    [projects, client],
  );

  const activeProjects = clientProjects.filter(
    (p) => p.status !== "completed" && p.status !== "archived",
  );
  const completedProjects = clientProjects.filter(
    (p) => p.status === "completed",
  );

  const financials = useMemo(() => {
    let totalAgreed = 0;
    let totalReceived = 0;
    for (const p of clientProjects) {
      const fin = computeFinancials(p, transactions);
      totalAgreed += fin.agreedValue;
      totalReceived += fin.totalReceived;
    }
    return { totalAgreed, totalReceived, outstanding: Math.max(totalAgreed - totalReceived, 0) };
  }, [clientProjects, transactions]);

  const clientTransactions = useMemo(
    () =>
      transactions
        .filter((t) =>
          clientProjects.some((p) => p.id === t.project_id) &&
          t.transaction_type === "income",
        )
        .slice(0, 15),
    [transactions, clientProjects],
  );

  if (!client) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <SheetTitle>{client.name}</SheetTitle>
              <SheetDescription>
                {client.company_name ?? "Individual client"}
              </SheetDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs"
                onClick={() => {
                  onEdit(client);
                  onClose();
                }}
              >
                <PencilSimple className="mr-1 h-3.5 w-3.5" weight="duotone" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/20"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${client.name}?`)) {
                    deleteClient.mutate(client.id);
                    onClose();
                  }
                }}
              >
                <Trash className="mr-1 h-3.5 w-3.5" weight="duotone" />
                Delete
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-4 px-1">
          {/* Contact info */}
          <div className="grid gap-2 text-sm">
            {client.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <EnvelopeSimple className="h-3.5 w-3.5" weight="duotone" />
                <a
                  href={`mailto:${client.email}`}
                  className="hover:text-foreground"
                >
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {client.phone}
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3.5 w-3.5" />
                <a
                  href={
                    client.website.startsWith("http")
                      ? client.website
                      : `https://${client.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {client.website}
                </a>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {client.address}
              </div>
            )}
          </div>

          {/* Financial summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Total Agreed</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {formatCurrency(financials.totalAgreed)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Received</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                {formatCurrency(financials.totalReceived)}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p
                className={`mt-1 text-lg font-semibold tabular-nums ${financials.outstanding > 0 ? "text-warning" : ""}`}
              >
                {formatCurrency(financials.outstanding)}
              </p>
            </div>
          </div>

          {/* Active projects */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Active Projects ({activeProjects.length})
            </h3>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active projects.
              </p>
            ) : (
              <ul className="space-y-2">
                {activeProjects.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <span className="text-sm font-medium">{p.name}</span>
                    <ProjectStatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Completed projects */}
          {completedProjects.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Completed Projects ({completedProjects.length})
              </h3>
              <ul className="space-y-2">
                {completedProjects.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <span className="text-sm">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(p.completed_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Payment history */}
          {clientTransactions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Payment History
              </h3>
              <ul className="space-y-1.5">
                {clientTransactions.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg p-2"
                  >
                    <div>
                      <span className="text-sm">
                        {t.category} · {formatDate(t.transaction_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums text-success">
                        {formatCurrency(t.amount, t.currency)}
                      </span>
                      <TransactionStatusBadge
                        status={t.status}
                        overdue={isTransactionOverdue(t)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {client.notes && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Notes
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
