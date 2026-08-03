import { Field } from "@/components/common";
import {
  ProjectStatusBadge,
  PriorityBadge,
  TypeBadge,
  PaymentStatusBadge,
} from "@/components/status-badges";
import { useClients } from "@/hooks/use-data";
import type { ProjectFinancials } from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/format";
import { labelize, type Project } from "@/lib/types";

export function ProjectOverviewTab({
  project,
  fin,
  progress,
}: {
  project: Project;
  fin: ProjectFinancials;
  progress: number | null;
}) {
  const { data: clients = [] } = useClients();
  const client = project.client_id
    ? clients.find((c) => c.id === project.client_id)
    : null;

  return (
    <div className="space-y-6">
      {/* Description */}
      {project.description && (
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {project.description}
          </p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          <TypeBadge type={project.project_type} />
        </Field>
        <Field label="Work Mode">{labelize(project.work_mode)}</Field>
        <Field label="Status">
          <ProjectStatusBadge status={project.status} />
        </Field>
        <Field label="Priority">
          <PriorityBadge priority={project.priority} />
        </Field>
        {fin.isClient && (
          <Field label="Client">
            {client ? (
              <span>
                {client.name}
                {client.company_name ? ` · ${client.company_name}` : ""}
              </span>
            ) : (
              <span className="text-muted-foreground">No client assigned</span>
            )}
          </Field>
        )}
        <Field label="Start Date">{formatDate(project.start_date)}</Field>
        <Field label="Target Date">{formatDate(project.target_date)}</Field>
        {project.completed_at && (
          <Field label="Completed">{formatDate(project.completed_at)}</Field>
        )}
        {project.next_action && (
          <Field label="Next Action">{project.next_action}</Field>
        )}
        {!fin.isClient && project.expected_outcome && (
          <Field label="Expected Outcome">{project.expected_outcome}</Field>
        )}
      </div>

      {/* Recurring info */}
      {project.work_mode === "recurring" && (
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Recurring Details
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Billing Frequency">
              {labelize(project.billing_frequency)}
            </Field>
            <Field label="Recurring Fee">
              {formatCurrency(project.recurring_fee, project.currency)}
            </Field>
            <Field label="Next Billing Date">
              {formatDate(project.next_billing_date)}
            </Field>
            <Field label="Recurring State">
              {labelize(project.recurring_state)}
            </Field>
          </div>
        </div>
      )}

      {/* Financial summary */}
      <div className="rounded-lg border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Financial Summary
        </p>
        {fin.isClient ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Value">
              {formatCurrency(fin.agreedValue, fin.currency)}
            </Field>
            <Field label="Total Received">
              <span className="text-success">
                {formatCurrency(fin.totalReceived, fin.currency)}
              </span>
            </Field>
            <Field label="Balance Due">
              <span className={fin.balanceDue > 0 ? "text-warning" : ""}>
                {formatCurrency(fin.balanceDue, fin.currency)}
              </span>
            </Field>
            <Field label="Payment Status">
              <PaymentStatusBadge status={fin.paymentStatus} />
            </Field>
            {fin.agreedValue > 0 && (
              <Field label="Payment Progress">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{
                        width: `${Math.min(100, fin.paymentProgress)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs tabular-nums">
                    {Math.round(fin.paymentProgress)}%
                  </span>
                </div>
              </Field>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Investment Budget">
              {formatCurrency(fin.investmentBudget, fin.currency)}
            </Field>
            <Field label="Total Spent">
              <span className={fin.overBudget ? "text-destructive" : ""}>
                {formatCurrency(fin.totalSpent, fin.currency)}
              </span>
            </Field>
            <Field label="Remaining Budget">
              <span
                className={fin.remainingBudget < 0 ? "text-destructive" : "text-success"}
              >
                {formatCurrency(fin.remainingBudget, fin.currency)}
              </span>
            </Field>
            {fin.investmentBudget > 0 && (
              <Field label="Budget Usage">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${fin.overBudget ? "bg-destructive" : "bg-primary"}`}
                      style={{
                        width: `${Math.min(100, fin.budgetUsage)}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs tabular-nums">
                    {Math.round(fin.budgetUsage)}%
                  </span>
                </div>
              </Field>
            )}
            {fin.overBudget && (
              <div className="col-span-full rounded-md border border-destructive/20 bg-destructive/5 p-2 text-xs text-destructive">
                ⚠ This project is over budget by{" "}
                {formatCurrency(Math.abs(fin.remainingBudget), fin.currency)}.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="rounded-lg border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Progress
        </p>
        {progress === null ? (
          <p className="text-sm text-muted-foreground">
            No milestones added yet. Add milestones to track progress.
          </p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <span className="text-sm font-medium tabular-nums">{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
