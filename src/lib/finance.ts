import type { Milestone, Project, Transaction } from "./types";
import { currentMonthKey, isPast, monthKey } from "./format";

export type PaymentStatus =
  | "not_applicable"
  | "unpaid"
  | "partially_paid"
  | "paid"
  | "overdue";

export interface ProjectFinancials {
  currency: string;
  isClient: boolean;
  agreedValue: number;
  totalReceived: number;
  expectedIncome: number;
  balanceDue: number;
  paymentProgress: number;
  paymentStatus: PaymentStatus;
  investmentBudget: number;
  totalSpent: number;
  remainingBudget: number;
  budgetUsage: number;
  overBudget: boolean;
  hasOverduePayment: boolean;
}

const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v)) || 0;

export function computeFinancials(
  project: Project,
  transactions: Transaction[],
): ProjectFinancials {
  const tx = transactions.filter((t) => t.project_id === project.id);
  const isClient = project.project_type === "client";

  const totalReceived = tx
    .filter((t) => t.transaction_type === "income" && t.status === "completed")
    .reduce((s, t) => s + num(t.amount), 0);

  const expectedIncome = tx
    .filter((t) => t.transaction_type === "income" && t.status === "expected")
    .reduce((s, t) => s + num(t.amount), 0);

  const totalSpent = tx
    .filter((t) => t.transaction_type === "expense" && t.status === "completed")
    .reduce((s, t) => s + num(t.amount), 0);

  const hasOverduePayment = tx.some(
    (t) =>
      t.transaction_type === "income" &&
      t.status === "expected" &&
      isPast(t.expected_date ?? t.transaction_date),
  );

  const agreedValue = num(project.agreed_value);
  const investmentBudget = num(project.investment_budget);
  const balanceDue = Math.max(agreedValue - totalReceived, 0);
  const paymentProgress = agreedValue > 0 ? (totalReceived / agreedValue) * 100 : 0;

  let paymentStatus: PaymentStatus = "not_applicable";
  if (isClient) {
    if (hasOverduePayment) paymentStatus = "overdue";
    else if (agreedValue > 0 && totalReceived === 0) paymentStatus = "unpaid";
    else if (agreedValue > 0 && totalReceived < agreedValue) paymentStatus = "partially_paid";
    else if (agreedValue > 0) paymentStatus = "paid";
    else paymentStatus = totalReceived > 0 ? "paid" : "unpaid";
  }

  return {
    currency: project.currency || "USD",
    isClient,
    agreedValue,
    totalReceived,
    expectedIncome,
    balanceDue,
    paymentProgress,
    paymentStatus,
    investmentBudget,
    totalSpent,
    remainingBudget: investmentBudget - totalSpent,
    budgetUsage: investmentBudget > 0 ? (totalSpent / investmentBudget) * 100 : 0,
    overBudget: investmentBudget > 0 && totalSpent > investmentBudget,
    hasOverduePayment,
  };
}

/** null when a project has no milestones — progress is unavailable, not zero. */
export function computeProgress(milestones: Milestone[]): number | null {
  if (milestones.length === 0) return null;
  const total = milestones.reduce((sum, m) => {
    if (m.status === "done") return sum + 100;
    if (m.status === "in_progress") return sum + 50;
    return sum;
  }, 0);
  return Math.round(total / milestones.length);
}

export function isProjectOverdue(project: Project): boolean {
  if (project.status === "completed" || project.status === "archived") return false;
  return isPast(project.target_date);
}

export interface AttentionReason {
  project: Project;
  reasons: string[];
}

export function projectsNeedingAttention(
  projects: Project[],
  transactions: Transaction[],
): AttentionReason[] {
  const out: AttentionReason[] = [];
  for (const project of projects) {
    if (project.status === "archived") continue;
    const fin = computeFinancials(project, transactions);
    const reasons: string[] = [];
    if (isProjectOverdue(project)) reasons.push("Target date passed");
    if (fin.hasOverduePayment) reasons.push("Overdue expected payment");
    if (project.priority === "urgent" && project.status !== "completed")
      reasons.push("Urgent priority");
    if (!fin.isClient && fin.overBudget) reasons.push("Over investment budget");
    if (reasons.length) out.push({ project, reasons });
  }
  return out;
}

export interface DashboardTotals {
  outstandingReceivables: number;
  collectedThisMonth: number;
  activeClientProjects: number;
  activeInvestmentProjects: number;
  overdueItems: number;
  investmentSpent: number;
}

export function computeDashboardTotals(
  projects: Project[],
  transactions: Transaction[],
): DashboardTotals {
  let outstandingReceivables = 0;
  let investmentSpent = 0;
  let overdueItems = 0;

  for (const project of projects) {
    const fin = computeFinancials(project, transactions);
    if (fin.isClient && project.status === "active") outstandingReceivables += fin.balanceDue;
    if (!fin.isClient) investmentSpent += fin.totalSpent;
    if (isProjectOverdue(project)) overdueItems += 1;
  }

  overdueItems += transactions.filter(
    (t) =>
      t.transaction_type === "income" &&
      t.status === "expected" &&
      isPast(t.expected_date ?? t.transaction_date),
  ).length;

  const thisMonth = currentMonthKey();
  const collectedThisMonth = transactions
    .filter(
      (t) =>
        t.transaction_type === "income" &&
        t.status === "completed" &&
        monthKey(t.transaction_date) === thisMonth,
    )
    .reduce((s, t) => s + num(t.amount), 0);

  return {
    outstandingReceivables,
    collectedThisMonth,
    activeClientProjects: projects.filter(
      (p) => p.project_type === "client" && p.status === "active",
    ).length,
    activeInvestmentProjects: projects.filter(
      (p) => p.project_type === "investment" && p.status === "active",
    ).length,
    overdueItems,
    investmentSpent,
  };
}

export function isTransactionOverdue(t: Transaction): boolean {
  return (
    t.transaction_type === "income" &&
    t.status === "expected" &&
    isPast(t.expected_date ?? t.transaction_date)
  );
}
