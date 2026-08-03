import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useClients, useProjects, useTransactions, useProfile } from "@/hooks/use-data";
import { useDeleteClient } from "@/hooks/use-mutations";
import { PageHeader, EmptyState, ErrorState, LoadingRows } from "@/components/common";
import { ClientFormDialog } from "@/components/client-form";
import { ClientDetailDrawer } from "@/components/client-detail-drawer";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { computeFinancials } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { Plus, Trash, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Client } from "@/lib/types";
import { convertCurrency } from "@/lib/currency";
import { CURRENCIES } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_app/clients")({
  component: ClientsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    detail: (search["detail"] as string) ?? undefined,
  }),
});

function ClientsPage() {
  const { data: clients, isLoading, error, refetch } = useClients();
  const { data: projects = [] } = useProjects();
  const { data: transactions = [] } = useTransactions();
  const deleteClient = useDeleteClient();
  const navigate = Route.useNavigate();
  const { detail: detailId } = Route.useSearch();
  const { data: profile } = useProfile();

  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  useEffect(() => {
    if (profile?.default_currency) {
      setSelectedCurrency(profile.default_currency);
    }
  }, [profile?.default_currency]);

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [cleaning, setCleaning] = useState(false);

  const enriched = useMemo(() => {
    return (clients ?? []).map((c) => {
      const clientProjects = projects.filter((p) => p.client_id === c.id);
      const active = clientProjects.filter((p) => p.status === "active").length;
      const completed = clientProjects.filter(
        (p) => p.status === "completed",
      ).length;
      let totalAgreed = 0;
      let totalReceived = 0;
      for (const p of clientProjects) {
        const fin = computeFinancials(p, transactions);
        const pCurrency = p.currency || "USD";
        totalAgreed += convertCurrency(fin.agreedValue, pCurrency, selectedCurrency);
        totalReceived += convertCurrency(fin.totalReceived, pCurrency, selectedCurrency);
      }
      return {
        client: c,
        active,
        completed,
        totalAgreed,
        totalReceived,
        outstanding: Math.max(totalAgreed - totalReceived, 0),
      };
    });
  }, [clients, projects, transactions, selectedCurrency]);

  const filtered = useMemo(() => {
    if (!search) return enriched;
    const q = search.toLowerCase();
    return enriched.filter(
      (e) =>
        e.client.name.toLowerCase().includes(q) ||
        (e.client.company_name?.toLowerCase().includes(q) ?? false),
    );
  }, [enriched, search]);

  const selectedClient = detailId
    ? (clients ?? []).find((c) => c.id === detailId) ?? null
    : null;

  const duplicateClientsCount = useMemo(() => {
    const names = new Map<string, number>();
    for (const e of enriched) {
      names.set(e.client.name, (names.get(e.client.name) ?? 0) + 1);
    }
    return enriched.filter(e => (names.get(e.client.name) ?? 0) > 1 && e.active === 0 && e.completed === 0).length;
  }, [enriched]);

  async function handleCleanDuplicates() {
    setCleaning(true);
    try {
      const names = new Map<string, string[]>();
      for (const e of enriched) {
        const list = names.get(e.client.name) ?? [];
        list.push(e.client.id);
        names.set(e.client.name, list);
      }

      let deletedCount = 0;
      for (const [name, ids] of names.entries()) {
        if (ids.length > 1) {
          const toDelete = enriched.filter(e => ids.slice(1).includes(e.client.id) && e.active === 0 && e.completed === 0);
          for (const item of toDelete) {
            await deleteClient.mutateAsync(item.client.id);
            deletedCount++;
          }
        }
      }
      refetch();
      toast.success(`Removed ${deletedCount} duplicate clients`);
    } catch (err: any) {
      toast.error(err.message || "Failed to clean duplicates");
    } finally {
      setCleaning(false);
    }
  }

  if (error)
    return (
      <ErrorState message="Failed to load clients." onRetry={() => refetch()} />
    );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clients"
        description={`${(clients ?? []).length} clients`}
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
            {duplicateClientsCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs text-destructive hover:bg-destructive/10 border-destructive/20 gap-1.5"
                disabled={cleaning}
                onClick={handleCleanDuplicates}
              >
                <Trash className="h-3.5 w-3.5" />
                Clean Duplicates ({duplicateClientsCount})
              </Button>
            )}
            <Button size="sm" className="h-7 text-xs" onClick={() => setFormOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New client
            </Button>
          </div>
        }
      />

      <Input
        placeholder="Search clients…"
        className="h-8 w-64"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <LoadingRows rows={5} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Add a client or create a client project."
          actionLabel="New client"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow
                  key={e.client.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    navigate({ search: { detail: e.client.id } })
                  }
                >
                  <TableCell>
                    <div>
                      <span className="font-medium">{e.client.name}</span>
                      {e.client.company_name && (
                        <p className="text-xs text-muted-foreground">
                          {e.client.company_name}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {e.active}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">
                    {e.completed}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(e.totalAgreed, selectedCurrency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-success">
                    {formatCurrency(e.totalReceived, selectedCurrency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={e.outstanding > 0 ? "text-warning" : ""}>
                      {formatCurrency(e.outstanding, selectedCurrency)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {e.client.email ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ClientFormDialog
        open={formOpen || !!editClient}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditClient(null);
          }
        }}
        client={editClient}
      />

      <ClientDetailDrawer
        client={selectedClient}
        open={!!detailId}
        onClose={() => navigate({ search: {} as any })}
        onEdit={setEditClient}
      />
    </div>
  );
}
