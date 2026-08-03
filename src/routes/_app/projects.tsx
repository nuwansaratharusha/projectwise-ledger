import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useProjects, useClients, useTransactions, useMilestones } from "@/hooks/use-data";
import { PageHeader, EmptyState, ErrorState, LoadingRows, ProgressBar } from "@/components/common";
import {
  ProjectStatusBadge,
  PriorityBadge,
  TypeBadge,
  PaymentStatusBadge,
} from "@/components/status-badges";
import { computeFinancials, computeProgress, isProjectOverdue, type PaymentStatus } from "@/lib/finance";
import { formatCurrency, formatDate, relativeDayLabel } from "@/lib/format";
import { labelize, type ProjectStatus, type ProjectType, type Priority, type WorkMode } from "@/lib/types";
import { ProjectFormDialog } from "@/components/project-form";
import { ProjectDetailDrawer } from "@/components/project-detail-drawer";
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
import { SquaresFour, List, X, Plus, WarningCircle } from "@phosphor-icons/react";
import type { Project } from "@/lib/types";

type SortKey = "name" | "target_date" | "newest" | "oldest" | "value" | "balance";

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    detail: (search["detail"] as string) ?? undefined,
  }),
});

function ProjectsPage() {
  const { detail: detailId } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: projects, isLoading, error, refetch } = useProjects();
  const { data: clients = [] } = useClients();
  const { data: transactions = [] } = useTransactions();
  const { data: milestones = [] } = useMilestones();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterPayment, setFilterPayment] = useState<string>("all");
  const [filterOverdue, setFilterOverdue] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<"table" | "card">("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const clientMap = useMemo(() => {
    const m = new Map<string, string>();
    clients.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [clients]);

  const enriched = useMemo(() => {
    return (projects ?? []).map((p) => {
      const fin = computeFinancials(p, transactions);
      const pMilestones = milestones.filter((m) => m.project_id === p.id);
      const progress = computeProgress(pMilestones);
      const overdue = isProjectOverdue(p);
      const clientName = p.client_id ? clientMap.get(p.client_id) ?? null : null;
      return { project: p, fin, progress, overdue, clientName };
    });
  }, [projects, transactions, milestones, clientMap]);

  const filtered = useMemo(() => {
    let list = enriched;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.project.name.toLowerCase().includes(q) ||
          (e.clientName?.toLowerCase().includes(q) ?? false),
      );
    }
    if (filterType !== "all")
      list = list.filter((e) => e.project.project_type === filterType);
    if (filterStatus !== "all")
      list = list.filter((e) => e.project.status === filterStatus);
    if (filterPriority !== "all")
      list = list.filter((e) => e.project.priority === filterPriority);
    if (filterPayment !== "all")
      list = list.filter((e) => e.fin.paymentStatus === filterPayment);
    if (filterOverdue === "overdue")
      list = list.filter((e) => e.overdue || e.fin.hasOverduePayment);

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.project.name.localeCompare(b.project.name);
        case "target_date":
          return (
            new Date(a.project.target_date ?? "9999").getTime() -
            new Date(b.project.target_date ?? "9999").getTime()
          );
        case "oldest":
          return (
            new Date(a.project.created_at).getTime() -
            new Date(b.project.created_at).getTime()
          );
        case "value":
          return (
            (b.fin.isClient ? b.fin.agreedValue : b.fin.investmentBudget) -
            (a.fin.isClient ? a.fin.agreedValue : a.fin.investmentBudget)
          );
        case "balance":
          return (
            (b.fin.isClient ? b.fin.balanceDue : b.fin.remainingBudget) -
            (a.fin.isClient ? a.fin.balanceDue : a.fin.remainingBudget)
          );
        default:
          return (
            new Date(b.project.created_at).getTime() -
            new Date(a.project.created_at).getTime()
          );
      }
    });

    return list;
  }, [enriched, search, filterType, filterStatus, filterPriority, filterPayment, filterOverdue, sort]);

  const hasActiveFilters =
    filterType !== "all" ||
    filterStatus !== "all" ||
    filterPriority !== "all" ||
    filterPayment !== "all" ||
    filterOverdue !== "all" ||
    search !== "";

  function clearFilters() {
    setSearch("");
    setFilterType("all");
    setFilterStatus("all");
    setFilterPriority("all");
    setFilterPayment("all");
    setFilterOverdue("all");
  }

  const selectedProject = detailId
    ? (projects ?? []).find((p) => p.id === detailId) ?? null
    : null;

  const detailOpen = !!detailId && !!selectedProject;

  if (error)
    return <ErrorState message="Failed to load projects." onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Projects"
        description={`${(projects ?? []).length} projects total`}
        actions={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New project
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search projects…"
          className="h-8 w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterSelect
          value={filterType}
          onChange={setFilterType}
          placeholder="Type"
          options={[
            { value: "all", label: "All types" },
            { value: "client", label: "Client" },
            { value: "investment", label: "Investment" },
          ]}
        />
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="Status"
          options={[
            { value: "all", label: "All statuses" },
            ...["planned", "active", "waiting", "on_hold", "completed", "archived"].map(
              (s) => ({ value: s, label: labelize(s) }),
            ),
          ]}
        />
        <FilterSelect
          value={filterPriority}
          onChange={setFilterPriority}
          placeholder="Priority"
          options={[
            { value: "all", label: "All priorities" },
            ...["low", "medium", "high", "urgent"].map((p) => ({
              value: p,
              label: labelize(p),
            })),
          ]}
        />
        <FilterSelect
          value={filterOverdue}
          onChange={setFilterOverdue}
          placeholder="Overdue"
          options={[
            { value: "all", label: "All" },
            { value: "overdue", label: "Overdue only" },
          ]}
        />
        <FilterSelect
          value={sort}
          onChange={(v) => setSort(v as SortKey)}
          placeholder="Sort"
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "name", label: "Name" },
            { value: "target_date", label: "Target date" },
            { value: "value", label: "Value" },
            { value: "balance", label: "Balance due" },
          ]}
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
        <div className="ml-auto flex gap-1">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "card" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("card")}
          >
            <SquaresFour className="h-4 w-4" weight="duotone" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingRows rows={8} />
      ) : filtered.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No matching projects"
            description="Try adjusting your filters or search query."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start tracking progress and money."
            actionLabel="New project"
            onAction={() => setFormOpen(true)}
          />
        )
      ) : view === "table" ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Project</TableHead>
                <TableHead>Client / Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Financial</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow
                  key={e.project.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    navigate({ search: { detail: e.project.id } })
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{e.project.name}</span>
                      {e.overdue && (
                        <WarningCircle className="h-3.5 w-3.5 text-destructive shrink-0" weight="duotone" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {e.fin.isClient
                      ? e.clientName ?? "—"
                      : "Internal"}
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={e.project.project_type} />
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
                    {e.fin.isClient ? (
                      <div>
                        <span className="text-sm">
                          {formatCurrency(e.fin.totalReceived, e.fin.currency)}
                        </span>
                        {e.fin.balanceDue > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(e.fin.balanceDue, e.fin.currency)} due
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-sm">
                          {formatCurrency(e.fin.totalSpent, e.fin.currency)}
                        </span>
                        {e.fin.investmentBudget > 0 && (
                          <p
                            className={`text-xs ${e.fin.overBudget ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {formatCurrency(e.fin.remainingBudget, e.fin.currency)}{" "}
                            {e.fin.overBudget ? "over" : "left"}
                          </p>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="text-sm">
                        {formatDate(e.project.target_date)}
                      </span>
                      {relativeDayLabel(e.project.target_date) && (
                        <p
                          className={`text-xs ${e.overdue ? "text-destructive" : "text-muted-foreground"}`}
                        >
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
      ) : (
        /* Card view */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <div
              key={e.project.id}
              className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
              onClick={() => navigate({ search: { detail: e.project.id } })}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold truncate">{e.project.name}</h3>
                <TypeBadge type={e.project.project_type} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {e.fin.isClient ? e.clientName ?? "No client" : "Internal"}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <ProjectStatusBadge status={e.project.status} />
                <PriorityBadge priority={e.project.priority} />
              </div>
              <div className="mt-3">
                <ProgressBar value={e.progress} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {e.fin.isClient
                    ? `${formatCurrency(e.fin.totalReceived, e.fin.currency)} received`
                    : `${formatCurrency(e.fin.totalSpent, e.fin.currency)} spent`}
                </span>
                <span>{formatDate(e.project.target_date)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormDialog
        open={formOpen || !!editProject}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditProject(null);
          }
        }}
        project={editProject}
      />

      <ProjectDetailDrawer
        project={selectedProject}
        open={!!detailId}
        onClose={() => navigate({ search: {} as any })}
        onEdit={setEditProject}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-[100px] text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
