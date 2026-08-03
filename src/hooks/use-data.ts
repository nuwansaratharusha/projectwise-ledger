import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import type {
  ActivityLog,
  Client,
  Milestone,
  Profile,
  Project,
  ProjectNote,
  Transaction,
} from "@/lib/types";

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("You must be signed in.");
  return data.user.id;
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: Partial<Profile>) => {
      const userId = await requireUserId();
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, full_name: values.full_name ?? "", ...values })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useClients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["clients", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Client[]> => {
      const { data, error } = await supabase.from("clients").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Transaction[]> => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("transaction_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMilestones() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["milestones", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Milestone[]> => {
      const { data, error } = await supabase
        .from("milestones")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectNotes(projectId: string | null) {
  return useQuery({
    queryKey: ["project_notes", projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ProjectNote[]> => {
      const { data, error } = await supabase
        .from("project_notes")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActivity(projectId?: string | null, limit = 40) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["activity", user?.id, projectId ?? "all"],
    enabled: !!user,
    queryFn: async (): Promise<ActivityLog[]> => {
      let q = supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export async function logActivity(input: {
  projectId?: string | null;
  actionType: string;
  title: string;
  description?: string | null;
}) {
  const userId = await requireUserId();
  await supabase.from("activity_logs").insert({
    user_id: userId,
    project_id: input.projectId ?? null,
    action_type: input.actionType,
    title: input.title,
    description: input.description ?? null,
  });
}

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    ["projects", "clients", "transactions", "milestones", "activity", "project_notes"].forEach(
      (key) => qc.invalidateQueries({ queryKey: [key] }),
    );
  };
}

export { requireUserId };
