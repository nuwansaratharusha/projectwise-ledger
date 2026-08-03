import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSaveMilestone } from "@/hooks/use-mutations";
import { labelize, type Milestone, type MilestoneStatus } from "@/lib/types";

export function MilestoneFormDialog({
  open,
  onOpenChange,
  projectId,
  milestone,
  nextSortOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  milestone?: Milestone | null;
  nextSortOrder: number;
}) {
  const save = useSaveMilestone();
  const [values, setValues] = useState({
    title: "",
    description: "",
    status: "not_started" as MilestoneStatus,
    due_date: "",
    billable_amount: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (milestone) {
      setValues({
        title: milestone.title,
        description: milestone.description ?? "",
        status: milestone.status,
        due_date: milestone.due_date ?? "",
        billable_amount: String(milestone.billable_amount ?? ""),
      });
    } else {
      setValues({
        title: "",
        description: "",
        status: "not_started",
        due_date: "",
        billable_amount: "",
      });
    }
  }, [open, milestone]);

  async function submit() {
    if (!values.title.trim()) {
      setError("Milestone title is required.");
      return;
    }
    await save.mutateAsync({
      ...(milestone ? { id: milestone.id } : {}),
      values: {
        project_id: projectId,
        title: values.title.trim(),
        description: values.description || null,
        status: values.status,
        due_date: values.due_date || null,
        billable_amount: Number(values.billable_amount || 0),
        sort_order: milestone?.sort_order ?? nextSortOrder,
        completed_at:
          values.status === "done" ? new Date().toISOString() : null,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {milestone ? "Edit milestone" : "Add milestone"}
          </DialogTitle>
          <DialogDescription>
            Track a deliverable or phase of this project.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ms-title">Title *</Label>
            <Input
              id="ms-title"
              value={values.title}
              onChange={(e) =>
                setValues({ ...values, title: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ms-desc">Description</Label>
            <Textarea
              id="ms-desc"
              rows={2}
              value={values.description}
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ms-status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(v) =>
                  setValues({ ...values, status: v as MilestoneStatus })
                }
              >
                <SelectTrigger id="ms-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["not_started", "in_progress", "done"] as MilestoneStatus[]
                  ).map((s) => (
                    <SelectItem key={s} value={s}>
                      {labelize(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ms-due">Due date</Label>
              <Input
                id="ms-due"
                type="date"
                value={values.due_date}
                onChange={(e) =>
                  setValues({ ...values, due_date: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ms-amount">Billable amount</Label>
              <Input
                id="ms-amount"
                type="number"
                min="0"
                step="0.01"
                value={values.billable_amount}
                onChange={(e) =>
                  setValues({ ...values, billable_amount: e.target.value })
                }
              />
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={save.isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
