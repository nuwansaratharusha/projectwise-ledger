import type { Tables, TablesInsert, TablesUpdate, Enums } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Client = Tables<"clients">;
export type Project = Tables<"projects">;
export type Milestone = Tables<"milestones">;
export type Transaction = Tables<"transactions">;
export type ProjectNote = Tables<"project_notes">;
export type ActivityLog = Tables<"activity_logs">;

export type ProjectInsert = TablesInsert<"projects">;
export type ProjectUpdate = TablesUpdate<"projects">;
export type ClientInsert = TablesInsert<"clients">;
export type MilestoneInsert = TablesInsert<"milestones">;
export type TransactionInsert = TablesInsert<"transactions">;

export type ProjectType = Enums<"project_type">;
export type WorkMode = Enums<"work_mode">;
export type ProjectStatus = Enums<"project_status">;
export type Priority = Enums<"priority_level">;
export type MilestoneStatus = Enums<"milestone_status">;
export type TransactionType = Enums<"transaction_type">;
export type TransactionStatus = Enums<"transaction_status">;

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planned",
  "active",
  "waiting",
  "on_hold",
  "completed",
  "archived",
];
export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
export const WORK_MODES: WorkMode[] = [
  "one_time",
  "recurring",
  "internal_product",
  "content_branding",
];

export const INCOME_CATEGORIES = [
  "Deposit",
  "Milestone Payment",
  "Final Payment",
  "Maintenance Fee",
  "Other Income",
];

export const EXPENSE_CATEGORIES = [
  "Hosting",
  "Domain",
  "Software",
  "Contractor",
  "Marketing",
  "Photography",
  "Design",
  "Development",
  "Content",
  "Other Expense",
];

export const CURRENCIES = ["USD", "EUR", "GBP", "LKR", "AUD", "CAD", "INR"];

export function labelize(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
