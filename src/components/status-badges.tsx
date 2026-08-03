import { cn } from "@/lib/utils";
import { labelize, type MilestoneStatus, type Priority, type ProjectStatus, type ProjectType, type TransactionStatus } from "@/lib/types";
import type { PaymentStatus } from "@/lib/finance";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "muted";

const toneClasses: Record<Tone, string> = {
  neutral: "border-border bg-secondary text-secondary-foreground",
  success: "border-success/25 bg-success/12 text-success",
  warning: "border-warning/30 bg-warning/15 text-warning",
  danger: "border-destructive/25 bg-destructive/12 text-destructive",
  info: "border-info/25 bg-info/12 text-info",
  muted: "border-border bg-muted text-muted-foreground",
};

export function StatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

const projectStatusTone: Record<ProjectStatus, Tone> = {
  planned: "muted",
  active: "info",
  waiting: "warning",
  on_hold: "warning",
  completed: "success",
  archived: "muted",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <StatusPill label={labelize(status)} tone={projectStatusTone[status]} />;
}

const priorityTone: Record<Priority, Tone> = {
  low: "muted",
  medium: "neutral",
  high: "warning",
  urgent: "danger",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <StatusPill label={labelize(priority)} tone={priorityTone[priority]} />;
}

export function TypeBadge({ type }: { type: ProjectType }) {
  return (
    <StatusPill
      label={type === "client" ? "Client" : "Investment"}
      tone={type === "client" ? "info" : "neutral"}
    />
  );
}

const paymentTone: Record<PaymentStatus, Tone> = {
  not_applicable: "muted",
  unpaid: "muted",
  partially_paid: "warning",
  paid: "success",
  overdue: "danger",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <StatusPill
      label={status === "not_applicable" ? "N/A" : labelize(status)}
      tone={paymentTone[status]}
    />
  );
}

const txTone: Record<TransactionStatus, Tone> = {
  expected: "warning",
  completed: "success",
  cancelled: "muted",
};

export function TransactionStatusBadge({
  status,
  overdue,
}: {
  status: TransactionStatus;
  overdue?: boolean;
}) {
  if (overdue && status === "expected") return <StatusPill label="Overdue" tone="danger" />;
  return <StatusPill label={labelize(status)} tone={txTone[status]} />;
}

const milestoneTone: Record<MilestoneStatus, Tone> = {
  not_started: "muted",
  in_progress: "info",
  done: "success",
};

export function MilestoneStatusBadge({ status }: { status: MilestoneStatus }) {
  return <StatusPill label={labelize(status)} tone={milestoneTone[status]} />;
}
