import { useEffect, useMemo, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientFormDialog } from "./client-form";
import { useClients, useProfile } from "@/hooks/use-data";
import { useCreateProject, useUpdateProject } from "@/hooks/use-mutations";
import {
  CURRENCIES,
  PRIORITIES,
  PROJECT_STATUSES,
  WORK_MODES,
  labelize,
  type Priority,
  type Project,
  type ProjectStatus,
  type ProjectType,
  type WorkMode,
} from "@/lib/types";

interface FormValues {
  name: string;
  description: string;
  project_type: ProjectType;
  work_mode: WorkMode;
  status: ProjectStatus;
  priority: Priority;
  client_id: string;
  currency: string;
  agreed_value: string;
  investment_budget: string;
  expected_outcome: string;
  start_date: string;
  target_date: string;
  next_action: string;
  billing_frequency: string;
  next_billing_date: string;
  recurring_fee: string;
  recurring_state: string;
}

const emptyValues = (currency: string): FormValues => ({
  name: "",
  description: "",
  project_type: "client",
  work_mode: "one_time",
  status: "active",
  priority: "medium",
  client_id: "none",
  currency,
  agreed_value: "",
  investment_budget: "",
  expected_outcome: "",
  start_date: "",
  target_date: "",
  next_action: "",
  billing_frequency: "monthly",
  next_billing_date: "",
  recurring_fee: "",
  recurring_state: "active",
});

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
}) {
  const { data: clients = [] } = useClients();
  const { data: profile } = useProfile();
  const create = useCreateProject();
  const update = useUpdateProject();
  const defaultCurrency = profile?.default_currency ?? "USD";

  const [values, setValues] = useState<FormValues>(emptyValues(defaultCurrency));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientDialog, setClientDialog] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (project) {
      setValues({
        name: project.name,
        description: project.description ?? "",
        project_type: project.project_type,
        work_mode: project.work_mode,
        status: project.status,
        priority: project.priority,
        client_id: project.client_id ?? "none",
        currency: project.currency,
        agreed_value: String(project.agreed_value ?? ""),
        investment_budget: String(project.investment_budget ?? ""),
        expected_outcome: project.expected_outcome ?? "",
        start_date: project.start_date ?? "",
        target_date: project.target_date ?? "",
        next_action: project.next_action ?? "",
        billing_frequency: project.billing_frequency ?? "monthly",
        next_billing_date: project.next_billing_date ?? "",
        recurring_fee: String(project.recurring_fee ?? ""),
        recurring_state: project.recurring_state ?? "active",
      });
    } else {
      setValues(emptyValues(defaultCurrency));
    }
  }, [open, project, defaultCurrency]);

  const isClient = values.project_type === "client";
  const isRecurring = values.work_mode === "recurring";
  const saving = create.isPending || update.isPending;

  const clientOptions = useMemo(
    () => clients.map((c) => ({ id: c.id, label: c.company_name ? `${c.name} · ${c.company_name}` : c.name })),
    [clients],
  );

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next["name"] = "Project name is required.";
    if (isClient && values.agreed_value && Number(values.agreed_value) < 0)
      next["agreed_value"] = "Value cannot be negative.";
    if (!isClient && values.investment_budget && Number(values.investment_budget) < 0)
      next["investment_budget"] = "Budget cannot be negative.";
    if (
      values.start_date &&
      values.target_date &&
      new Date(values.target_date) < new Date(values.start_date)
    )
      next["target_date"] = "Target date must be after the start date.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    const payload = {
      name: values.name.trim(),
      slug: values.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      description: values.description || null,
      project_type: values.project_type,
      work_mode: values.work_mode,
      status: values.status,
      priority: values.priority,
      client_id: isClient && values.client_id !== "none" ? values.client_id : null,
      currency: values.currency,
      agreed_value: isClient ? Number(values.agreed_value || 0) : 0,
      investment_budget: !isClient ? Number(values.investment_budget || 0) : 0,
      expected_outcome: values.expected_outcome || null,
      start_date: values.start_date || null,
      target_date: values.target_date || null,
      next_action: values.next_action || null,
      billing_frequency: isRecurring
        ? (values.billing_frequency as Project["billing_frequency"])
        : null,
      next_billing_date: isRecurring ? values.next_billing_date || null : null,
      recurring_fee: isRecurring ? Number(values.recurring_fee || 0) : 0,
      recurring_state: isRecurring
        ? (values.recurring_state as Project["recurring_state"])
        : null,
    };

    if (project) {
      await update.mutateAsync({
        id: project.id,
        values: payload,
        activity: { actionType: "project_updated", title: "Project updated" },
      });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{project ? "Edit project" : "New project"}</DialogTitle>
            <DialogDescription>
              Track client work or an internal investment project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <section className="space-y-4">
              <SectionTitle>Basic information</SectionTitle>
              <div className="grid gap-2">
                <Label htmlFor="p-name">Project name *</Label>
                <Input
                  id="p-name"
                  value={values.name}
                  aria-invalid={!!errors["name"]}
                  onChange={(e) => setValues({ ...values, name: e.target.value })}
                />
                {errors["name"] ? (
                  <p className="text-sm text-destructive">{errors["name"]}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-desc">Description</Label>
                <Textarea
                  id="p-desc"
                  rows={3}
                  value={values.description}
                  onChange={(e) => setValues({ ...values, description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="p-type">Project type</Label>
                  <Select
                    value={values.project_type}
                    onValueChange={(v) =>
                      setValues({ ...values, project_type: v as ProjectType })
                    }
                  >
                    <SelectTrigger id="p-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client project</SelectItem>
                      <SelectItem value="investment">Investment project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-mode">Work mode</Label>
                  <Select
                    value={values.work_mode}
                    onValueChange={(v) => setValues({ ...values, work_mode: v as WorkMode })}
                  >
                    <SelectTrigger id="p-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_MODES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {labelize(m)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-status">Status</Label>
                  <Select
                    value={values.status}
                    onValueChange={(v) => setValues({ ...values, status: v as ProjectStatus })}
                  >
                    <SelectTrigger id="p-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {labelize(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-priority">Priority</Label>
                  <Select
                    value={values.priority}
                    onValueChange={(v) => setValues({ ...values, priority: v as Priority })}
                  >
                    <SelectTrigger id="p-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {labelize(p)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator />

            <section className="space-y-4">
              <SectionTitle>{isClient ? "Client" : "Ownership"}</SectionTitle>
              {isClient ? (
                <div className="grid gap-2">
                  <Label htmlFor="p-client">Client (optional, can be added later)</Label>
                  <div className="flex gap-2">
                    <Select
                      value={values.client_id}
                      onValueChange={(v) => setValues({ ...values, client_id: v })}
                    >
                      <SelectTrigger id="p-client" className="flex-1">
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No client yet</SelectItem>
                        {clientOptions.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setClientDialog(true)}>
                      New client
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  Internal / owned project — no client required.
                </p>
              )}
            </section>

            <Separator />

            <section className="space-y-4">
              <SectionTitle>Financial information</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="p-currency">Currency</Label>
                  <Select
                    value={values.currency}
                    onValueChange={(v) => setValues({ ...values, currency: v })}
                  >
                    <SelectTrigger id="p-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isClient ? (
                  <div className="grid gap-2">
                    <Label htmlFor="p-value">Value</Label>
                    <Input
                      id="p-value"
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.agreed_value}
                      onChange={(e) => setValues({ ...values, agreed_value: e.target.value })}
                    />
                    {errors["agreed_value"] ? (
                      <p className="text-sm text-destructive">{errors["agreed_value"]}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="p-budget">Investment budget</Label>
                    <Input
                      id="p-budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.investment_budget}
                      onChange={(e) =>
                        setValues({ ...values, investment_budget: e.target.value })
                      }
                    />
                    {errors["investment_budget"] ? (
                      <p className="text-sm text-destructive">{errors["investment_budget"]}</p>
                    ) : null}
                  </div>
                )}
              </div>
              {!isClient ? (
                <div className="grid gap-2">
                  <Label htmlFor="p-outcome">Expected outcome</Label>
                  <Textarea
                    id="p-outcome"
                    rows={2}
                    value={values.expected_outcome}
                    onChange={(e) => setValues({ ...values, expected_outcome: e.target.value })}
                  />
                </div>
              ) : null}
              {isRecurring ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="p-freq">Billing frequency</Label>
                    <Select
                      value={values.billing_frequency}
                      onValueChange={(v) => setValues({ ...values, billing_frequency: v })}
                    >
                      <SelectTrigger id="p-freq">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["monthly", "quarterly", "yearly", "custom"].map((f) => (
                          <SelectItem key={f} value={f}>
                            {labelize(f)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="p-next-bill">Next billing date</Label>
                    <Input
                      id="p-next-bill"
                      type="date"
                      value={values.next_billing_date}
                      onChange={(e) =>
                        setValues({ ...values, next_billing_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="p-fee">Recurring fee</Label>
                    <Input
                      id="p-fee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={values.recurring_fee}
                      onChange={(e) => setValues({ ...values, recurring_fee: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="p-recstate">Recurring state</Label>
                    <Select
                      value={values.recurring_state}
                      onValueChange={(v) => setValues({ ...values, recurring_state: v })}
                    >
                      <SelectTrigger id="p-recstate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["active", "paused", "ended"].map((s) => (
                          <SelectItem key={s} value={s}>
                            {labelize(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}
            </section>

            <Separator />

            <section className="space-y-4">
              <SectionTitle>Schedule</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="p-start">Start date</Label>
                  <Input
                    id="p-start"
                    type="date"
                    value={values.start_date}
                    onChange={(e) => setValues({ ...values, start_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="p-target">Target date</Label>
                  <Input
                    id="p-target"
                    type="date"
                    value={values.target_date}
                    onChange={(e) => setValues({ ...values, target_date: e.target.value })}
                  />
                  {errors["target_date"] ? (
                    <p className="text-sm text-destructive">{errors["target_date"]}</p>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="p-next">Next action</Label>
                <Input
                  id="p-next"
                  value={values.next_action}
                  onChange={(e) => setValues({ ...values, next_action: e.target.value })}
                />
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving…" : project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ClientFormDialog
        open={clientDialog}
        onOpenChange={setClientDialog}
        onCreated={(c) => setValues((v) => ({ ...v, client_id: c.id }))}
      />
    </>
  );
}
