import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logActivity, requireUserId } from "./use-data";
import type {
  ClientInsert,
  Milestone,
  MilestoneInsert,
  Project,
  ProjectInsert,
  ProjectUpdate,
  Transaction,
  TransactionInsert,
} from "@/lib/types";

function useInvalidate(keys: string[]) {
  const qc = useQueryClient();
  return () => keys.forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
}

export function useCreateProject() {
  const invalidate = useInvalidate(["projects", "activity"]);
  return useMutation({
    mutationFn: async (values: Omit<ProjectInsert, "user_id">) => {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...values, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      await logActivity({
        projectId: data.id,
        actionType: "project_created",
        title: "Project created",
        description: data.name,
      });
      return data as Project;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidate(["projects", "activity"]);
  return useMutation({
    mutationFn: async ({
      id,
      values,
      activity,
    }: {
      id: string;
      values: ProjectUpdate;
      activity?: { actionType: string; title: string; description?: string };
    }) => {
      const { error } = await supabase.from("projects").update(values).eq("id", id);
      if (error) throw error;
      if (activity) {
        await logActivity({ projectId: id, ...activity });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidate(["projects", "transactions", "milestones", "activity"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Project deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateClient() {
  const invalidate = useInvalidate(["clients"]);
  return useMutation({
    mutationFn: async (values: Omit<ClientInsert, "user_id">) => {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...values, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Client saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateClient() {
  const invalidate = useInvalidate(["clients"]);
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<ClientInsert> }) => {
      const { error } = await supabase.from("clients").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Client updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteClient() {
  const invalidate = useInvalidate(["clients", "projects"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Client deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSaveMilestone() {
  const invalidate = useInvalidate(["milestones", "activity"]);
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<MilestoneInsert, "user_id">;
    }) => {
      const userId = await requireUserId();
      if (id) {
        const { error } = await supabase.from("milestones").update(values).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("milestones").insert({ ...values, user_id: userId });
      if (error) throw error;
      await logActivity({
        projectId: values.project_id,
        actionType: "milestone_added",
        title: "Milestone added",
        description: values.title,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Milestone saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSetMilestoneStatus() {
  const invalidate = useInvalidate(["milestones", "activity"]);
  return useMutation({
    mutationFn: async ({ milestone, status }: { milestone: Milestone; status: Milestone["status"] }) => {
      const { error } = await supabase
        .from("milestones")
        .update({
          status,
          completed_at: status === "done" ? new Date().toISOString() : null,
        })
        .eq("id", milestone.id);
      if (error) throw error;
      if (status === "done") {
        await logActivity({
          projectId: milestone.project_id,
          actionType: "milestone_completed",
          title: "Milestone completed",
          description: milestone.title,
        });
      }
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReorderMilestones() {
  const invalidate = useInvalidate(["milestones"]);
  return useMutation({
    mutationFn: async (ordered: Milestone[]) => {
      await Promise.all(
        ordered.map((m, index) =>
          supabase.from("milestones").update({ sort_order: index }).eq("id", m.id),
        ),
      );
    },
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMilestone() {
  const invalidate = useInvalidate(["milestones"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("milestones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Milestone deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSaveTransaction() {
  const invalidate = useInvalidate(["transactions", "activity"]);
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<TransactionInsert, "user_id">;
    }) => {
      const userId = await requireUserId();
      if (Number(values.amount) <= 0) throw new Error("Amount must be greater than zero.");
      if (id) {
        const { error } = await supabase.from("transactions").update(values).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("transactions").insert({ ...values, user_id: userId });
      if (error) throw error;
      await logActivity({
        projectId: values.project_id,
        actionType: values.transaction_type === "income" ? "payment_recorded" : "expense_recorded",
        title: values.transaction_type === "income" ? "Payment recorded" : "Expense recorded",
        description: `${values.category} · ${values.amount}`,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Transaction saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTransactionStatus() {
  const invalidate = useInvalidate(["transactions"]);
  return useMutation({
    mutationFn: async ({ tx, status }: { tx: Transaction; status: Transaction["status"] }) => {
      const { error } = await supabase
        .from("transactions")
        .update({
          status,
          transaction_date:
            status === "completed"
              ? new Date().toISOString().slice(0, 10)
              : tx.transaction_date,
        })
        .eq("id", tx.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Transaction updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidate(["transactions"]);
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Transaction deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSaveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      content,
    }: {
      id?: string;
      projectId: string;
      content: string;
    }) => {
      const userId = await requireUserId();
      if (id) {
        const { error } = await supabase.from("project_notes").update({ content }).eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("project_notes")
        .insert({ user_id: userId, project_id: projectId, content });
      if (error) throw error;
      await logActivity({
        projectId,
        actionType: "note_added",
        title: "Note added",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_notes"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
      toast.success("Note saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_notes"] });
      toast.success("Note deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
