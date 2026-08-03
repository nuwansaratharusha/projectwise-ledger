import { useMemo, useState } from "react";
import { useMilestones } from "@/hooks/use-data";
import {
  useSaveMilestone,
  useSetMilestoneStatus,
  useDeleteMilestone,
  useReorderMilestones,
} from "@/hooks/use-mutations";
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
import { formatCurrency, formatDate, relativeDayLabel } from "@/lib/format";
import { isPast } from "@/lib/format";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  PencilSimple,
  Trash,
  CheckCircle,
  Circle,
  CircleDashed,
} from "@phosphor-icons/react";
import type { Milestone, MilestoneStatus, Project } from "@/lib/types";
import { MilestoneFormDialog } from "./milestone-form";
import { cn } from "@/lib/utils";

export function MilestonesTab({ project }: { project: Project }) {
  const { data: allMilestones = [] } = useMilestones();
  const saveMilestone = useSaveMilestone();
  const setStatus = useSetMilestoneStatus();
  const deleteMilestone = useDeleteMilestone();
  const reorder = useReorderMilestones();

  const [formOpen, setFormOpen] = useState(false);
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const milestones = useMemo(
    () =>
      allMilestones
        .filter((m) => m.project_id === project.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    [allMilestones, project.id],
  );

  const doneCount = milestones.filter((m) => m.status === "done").length;
  const totalCount = milestones.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  function handleStatusCycle(milestone: Milestone) {
    const next: Record<MilestoneStatus, MilestoneStatus> = {
      not_started: "in_progress",
      in_progress: "done",
      done: "not_started",
    };
    setStatus.mutate({ milestone, status: next[milestone.status] });
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const reordered = [...milestones];
    const [item] = reordered.splice(index, 1);
    reordered.splice(index - 1, 0, item!);
    reorder.mutate(reordered);
  }

  function handleMoveDown(index: number) {
    if (index >= milestones.length - 1) return;
    const reordered = [...milestones];
    const [item] = reordered.splice(index, 1);
    reordered.splice(index + 1, 0, item!);
    reorder.mutate(reordered);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-[13px] font-medium">
            Steps
          </p>
          {totalCount > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {doneCount}/{totalCount} completed
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1 h-3 w-3" weight="bold" />
          Add step
        </Button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {progressPct === 100
              ? "All steps completed ✓"
              : progressPct > 0
                ? `${progressPct}% complete`
                : "Not started yet"}
          </p>
        </div>
      )}

      {milestones.length === 0 ? (
        <EmptyState
          title="No steps yet"
          description="Break down this project into clear, ordered steps."
          actionLabel="Add first step"
          onAction={() => setFormOpen(true)}
        />
      ) : (
        /* ─── Timeline ─── */
        <ol className="relative">
          {milestones.map((m, i) => {
            const overdue = m.status !== "done" && m.due_date && isPast(m.due_date);
            const isDone = m.status === "done";
            const isInProgress = m.status === "in_progress";
            const isLast = i === milestones.length - 1;

            return (
              <li key={m.id} className="relative flex gap-3 pb-0">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  {/* Step icon — clickable to cycle status */}
                  <button
                    type="button"
                    className="relative z-10 cursor-pointer shrink-0 mt-0.5"
                    onClick={() => handleStatusCycle(m)}
                    aria-label={`Step ${i + 1}: ${m.status}`}
                  >
                    {isDone ? (
                      <CheckCircle className="h-5 w-5 text-success" weight="fill" />
                    ) : isInProgress ? (
                      <CircleDashed className="h-5 w-5 text-primary animate-[spin_4s_linear_infinite]" weight="bold" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/40" />
                    )}
                  </button>
                  {/* Vertical line */}
                  {!isLast && (
                    <div
                      className={cn(
                        "w-px flex-1 min-h-6",
                        isDone ? "bg-success/40" : "bg-border",
                      )}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className={cn("min-w-0 flex-1 pb-4", isLast && "pb-0")}>
                  <div
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      overdue
                        ? "border-destructive/20 bg-destructive/5"
                        : isInProgress
                          ? "border-primary/20 bg-primary/5"
                          : isDone
                            ? "border-success/10 bg-success/5"
                            : "border-border",
                    )}
                  >
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-muted-foreground tabular-nums shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <p
                            className={cn(
                              "text-[13px] font-medium truncate",
                              isDone && "line-through text-muted-foreground",
                            )}
                          >
                            {m.title}
                          </p>
                        </div>
                        {m.description && (
                          <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed pl-7">
                            {m.description}
                          </p>
                        )}
                      </div>

                      {/* Status label */}
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          isDone
                            ? "bg-success/10 text-success"
                            : isInProgress
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isDone ? "Done" : isInProgress ? "In Progress" : "Pending"}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-7 text-[11px] text-muted-foreground">
                      {m.due_date && (
                        <span className={cn(overdue && "text-destructive font-medium")}>
                          {formatDate(m.due_date)}
                          {relativeDayLabel(m.due_date) && (
                            <span className="ml-1">({relativeDayLabel(m.due_date)})</span>
                          )}
                        </span>
                      )}
                      {Number(m.billable_amount) > 0 && (
                        <span className="tabular-nums">
                          {formatCurrency(m.billable_amount, project.currency)}
                        </span>
                      )}

                      {/* Actions */}
                      <div className="ml-auto flex items-center gap-0.5">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-muted cursor-pointer disabled:opacity-30"
                          onClick={() => handleMoveUp(i)}
                          disabled={i === 0}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-muted cursor-pointer disabled:opacity-30"
                          onClick={() => handleMoveDown(i)}
                          disabled={i === milestones.length - 1}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-muted cursor-pointer"
                          onClick={() => {
                            setEditMilestone(m);
                            setFormOpen(true);
                          }}
                          aria-label="Edit step"
                        >
                          <PencilSimple className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-destructive/10 text-destructive cursor-pointer"
                          onClick={() => setDeleteId(m.id)}
                          aria-label="Delete step"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <MilestoneFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditMilestone(null);
          }
        }}
        projectId={project.id}
        milestone={editMilestone}
        nextSortOrder={milestones.length}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete step?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteMilestone.mutate(deleteId);
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
