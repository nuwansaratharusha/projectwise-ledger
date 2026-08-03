import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  ProjectStatusBadge,
  PriorityBadge,
  TypeBadge,
} from "@/components/status-badges";
import { ProgressBar } from "@/components/common";
import { useTransactions, useMilestones } from "@/hooks/use-data";
import { useUpdateProject, useDeleteProject } from "@/hooks/use-mutations";
import { computeFinancials, computeProgress } from "@/lib/finance";
import { formatDate, relativeDayLabel } from "@/lib/format";
import { DotsThree, PencilSimple, CheckCircle, Archive, Trash } from "@phosphor-icons/react";
import type { Project } from "@/lib/types";
import { ProjectOverviewTab } from "./project-overview-tab";
import { MilestonesTab } from "./milestones-tab";
import { MoneyTab } from "./money-tab";
import { NotesTab } from "./notes-tab";
import { ActivityTab } from "./activity-tab";

export function ProjectDetailDrawer({
  project,
  open,
  onClose,
  onEdit,
}: {
  project: Project | null;
  open: boolean;
  onClose: () => void;
  onEdit: (p: Project) => void;
}) {
  const { data: transactions = [] } = useTransactions();
  const { data: allMilestones = [] } = useMilestones();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!project) return null;

  const fin = computeFinancials(project, transactions);
  const projectMilestones = allMilestones.filter(
    (m) => m.project_id === project.id,
  );
  const progress = computeProgress(projectMilestones);

  function handleComplete() {
    updateProject.mutate({
      id: project!.id,
      values: {
        status: "completed",
        completed_at: new Date().toISOString(),
      },
      activity: {
        actionType: "project_completed",
        title: "Project completed",
        description: project!.name,
      },
    });
  }

  function handleReopen() {
    updateProject.mutate({
      id: project!.id,
      values: {
        status: "active",
        completed_at: null,
      },
      activity: {
        actionType: "project_reopened",
        title: "Project reopened",
        description: project!.name,
      },
    });
  }

  function handleArchive() {
    updateProject.mutate({
      id: project!.id,
      values: { status: "archived" },
      activity: {
        actionType: "project_archived",
        title: "Project archived",
        description: project!.name,
      },
    });
  }

  function handleDelete() {
    deleteProject.mutate(project!.id);
    setDeleteConfirm(false);
    onClose();
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto p-0 sm:max-w-2xl lg:max-w-3xl"
        >
          <SheetHeader className="border-b border-border px-6 pb-4 pt-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg font-semibold leading-tight truncate">
                  {project.name}
                </SheetTitle>
                <SheetDescription className="mt-1 flex flex-wrap items-center gap-2">
                  <TypeBadge type={project.project_type} />
                  <ProjectStatusBadge status={project.status} />
                  <PriorityBadge priority={project.priority} />
                </SheetDescription>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEdit(project);
                    onClose();
                  }}
                >
                  <PencilSimple className="mr-1.5 h-3.5 w-3.5" weight="duotone" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <DotsThree className="h-4 w-4" weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {project.status === "completed" ? (
                      <DropdownMenuItem onClick={handleReopen}>
                        <CheckCircle className="mr-2 h-4 w-4" weight="duotone" />
                        Reopen project
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={handleComplete}>
                        <CheckCircle className="mr-2 h-4 w-4" weight="duotone" />
                        Mark completed
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleArchive}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteConfirm(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash className="mr-2 h-4 w-4" weight="duotone" />
                      Delete project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Progress + target */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Progress</span>
                <ProgressBar value={progress} />
              </div>
              {project.target_date && (
                <span className="text-xs text-muted-foreground">
                  Target: {formatDate(project.target_date)}
                  {relativeDayLabel(project.target_date) && (
                    <span className="ml-1 text-foreground">
                      ({relativeDayLabel(project.target_date)})
                    </span>
                  )}
                </span>
              )}
            </div>
          </SheetHeader>

          <Tabs defaultValue="overview" className="px-6 pt-4 pb-6">
            <TabsList className="mb-4 w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="milestones">Steps</TabsTrigger>
              <TabsTrigger value="money">Money</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <ProjectOverviewTab project={project} fin={fin} progress={progress} />
            </TabsContent>
            <TabsContent value="milestones">
              <MilestonesTab project={project} />
            </TabsContent>
            <TabsContent value="money">
              <MoneyTab project={project} fin={fin} />
            </TabsContent>
            <TabsContent value="notes">
              <NotesTab projectId={project.id} />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityTab projectId={project.id} />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{project.name}" and all its
              milestones, transactions, and notes. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
