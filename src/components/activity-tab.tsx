import { useActivity } from "@/hooks/use-data";
import { EmptyState } from "@/components/common";
import { formatDateTime } from "@/lib/format";
import {
  FolderSimple,
  CheckCircle,
  Flag,
  CreditCard,
  Receipt,
  FileText,
  Archive,
  ArrowsClockwise,
  CalendarCheck,
  Lightning,
} from "@phosphor-icons/react";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  project_created: <FolderSimple className="h-3.5 w-3.5 text-primary" weight="duotone" />,
  project_updated: <ArrowsClockwise className="h-3.5 w-3.5 text-info" weight="duotone" />,
  project_completed: <CheckCircle className="h-3.5 w-3.5 text-success" weight="duotone" />,
  project_reopened: <ArrowsClockwise className="h-3.5 w-3.5 text-warning" weight="duotone" />,
  project_archived: <Archive className="h-3.5 w-3.5 text-muted-foreground" weight="duotone" />,
  milestone_added: <Flag className="h-3.5 w-3.5 text-info" weight="duotone" />,
  milestone_completed: <CheckCircle className="h-3.5 w-3.5 text-success" weight="duotone" />,
  payment_recorded: <CreditCard className="h-3.5 w-3.5 text-success" weight="duotone" />,
  expense_recorded: <Receipt className="h-3.5 w-3.5 text-warning" weight="duotone" />,
  note_added: <FileText className="h-3.5 w-3.5 text-muted-foreground" weight="duotone" />,
  target_date_changed: <CalendarCheck className="h-3.5 w-3.5 text-info" weight="duotone" />,
};

export function ActivityTab({ projectId }: { projectId: string }) {
  const { data: activity = [] } = useActivity(projectId);

  if (activity.length === 0) {
    return (
      <EmptyState
        title="No activity recorded"
        description="Actions like status changes, payments, and milestones will appear here."
      />
    );
  }

  return (
    <div className="relative space-y-0">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      <ul className="space-y-0">
        {activity.map((a) => (
          <li key={a.id} className="relative flex gap-3 pb-4">
            <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card">
              {ACTION_ICONS[a.action_type] ?? (
                <Lightning className="h-3.5 w-3.5 text-muted-foreground" weight="duotone" />
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm">{a.title}</p>
              {a.description && (
                <p className="text-xs text-muted-foreground">
                  {a.description}
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDateTime(a.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
