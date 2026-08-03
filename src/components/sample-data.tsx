import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkle } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import type { TransactionInsert, MilestoneInsert } from "@/lib/types";

const SAMPLE_CLIENTS = [
  { name: "Sarah Chen", company_name: "Chen Studios", email: "sarah@chenstudios.com" },
  { name: "Marcus Webb", company_name: "Webb Digital", email: "marcus@webbdigital.co" },
  { name: "Diana Reyes", company_name: "Reyes Corp", email: "diana@reyescorp.io" },
  { name: "Akira Tanaka", company_name: null, email: "akira@freelance.dev" },
];

const SAMPLE_PROJECTS = (clientIds: string[]) => [
  // Client projects
  {
    name: "Chen Studios Website Redesign",
    project_type: "client" as const,
    work_mode: "one_time" as const,
    status: "active" as const,
    priority: "high" as const,
    client_id: clientIds[0]!,
    description: "Full responsive redesign for Chen Studios portfolio and booking system.",
    agreed_value: 8500,
    currency: "USD",
    start_date: daysAgo(45),
    target_date: daysFromNow(15),
  },
  {
    name: "Webb Digital Monthly Retainer",
    project_type: "client" as const,
    work_mode: "recurring" as const,
    status: "active" as const,
    priority: "medium" as const,
    client_id: clientIds[1]!,
    description: "Ongoing website maintenance, content updates, and SEO.",
    agreed_value: 2000,
    currency: "USD",
    billing_frequency: "monthly" as const,
    recurring_fee: 2000,
    recurring_state: "active" as const,
    start_date: daysAgo(90),
  },
  {
    name: "Reyes Corp Brand Identity",
    project_type: "client" as const,
    work_mode: "one_time" as const,
    status: "completed" as const,
    priority: "high" as const,
    client_id: clientIds[2]!,
    description: "Complete brand identity including logo, colors, typography, and guidelines.",
    agreed_value: 12000,
    currency: "USD",
    start_date: daysAgo(120),
    target_date: daysAgo(30),
    completed_at: daysAgo(28),
  },
  {
    name: "Akira Portfolio Site",
    project_type: "client" as const,
    work_mode: "one_time" as const,
    status: "waiting" as const,
    priority: "low" as const,
    client_id: clientIds[3]!,
    description: "Minimal developer portfolio with project showcases.",
    agreed_value: 3500,
    currency: "USD",
    start_date: daysAgo(20),
    target_date: daysFromNow(25),
  },
  {
    name: "Chen Studios E-commerce",
    project_type: "client" as const,
    work_mode: "one_time" as const,
    status: "planned" as const,
    priority: "medium" as const,
    client_id: clientIds[0]!,
    description: "Online store for prints and photography packages.",
    agreed_value: 15000,
    currency: "USD",
    target_date: daysFromNow(90),
  },
  {
    name: "Webb Digital SEO Audit",
    project_type: "client" as const,
    work_mode: "one_time" as const,
    status: "active" as const,
    priority: "urgent" as const,
    client_id: clientIds[1]!,
    description: "Deep technical SEO audit with competitor analysis and roadmap.",
    agreed_value: 4500,
    currency: "USD",
    start_date: daysAgo(10),
    target_date: daysAgo(2), // overdue!
  },
  // Investment projects
  {
    name: "Personal Portfolio v3",
    project_type: "investment" as const,
    work_mode: "one_time" as const,
    status: "active" as const,
    priority: "medium" as const,
    description: "Rebuild personal portfolio with blog, case studies, and testimonials.",
    investment_budget: 500,
    currency: "USD",
    start_date: daysAgo(30),
    target_date: daysFromNow(20),
    expected_outcome: "Attract higher-quality inbound leads and speaking opportunities.",
  },
  {
    name: "Design System Starter Kit",
    project_type: "investment" as const,
    work_mode: "one_time" as const,
    status: "active" as const,
    priority: "high" as const,
    description: "Open-source design system and component library for sale on Gumroad.",
    investment_budget: 2000,
    currency: "USD",
    start_date: daysAgo(60),
    target_date: daysFromNow(30),
    expected_outcome: "Passive revenue from sales. Target: $500/month within 6 months.",
  },
  {
    name: "YouTube Channel Setup",
    project_type: "investment" as const,
    work_mode: "recurring" as const,
    status: "planned" as const,
    priority: "low" as const,
    description: "Start a dev/design YouTube channel. Equipment, editing, thumbnails.",
    investment_budget: 3000,
    currency: "USD",
    billing_frequency: "monthly" as const,
    recurring_fee: 300,
    recurring_state: "paused" as const,
    expected_outcome: "Build audience, create inbound funnel, future sponsorships.",
  },
  {
    name: "Freelance CRM Tool",
    project_type: "investment" as const,
    work_mode: "one_time" as const,
    status: "on_hold" as const,
    priority: "low" as const,
    description: "Build a lightweight CRM for freelancers (possibly a SaaS product).",
    investment_budget: 1500,
    currency: "USD",
    start_date: daysAgo(100),
    expected_outcome: "Internal tool first, evaluate product-market fit later.",
  },
  {
    name: "Conference Speaking 2026",
    project_type: "investment" as const,
    work_mode: "one_time" as const,
    status: "active" as const,
    priority: "medium" as const,
    description: "Prepare talks, submit to conferences, travel budget.",
    investment_budget: 4000,
    currency: "USD",
    start_date: daysAgo(15),
    target_date: daysFromNow(60),
    expected_outcome: "2–3 conference talks, networking, brand visibility.",
  },
  {
    name: "Client Onboarding Templates",
    project_type: "investment" as const,
    work_mode: "one_time" as const,
    status: "completed" as const,
    priority: "high" as const,
    description: "Create reusable onboarding docs, contracts, and questionnaires.",
    investment_budget: 200,
    currency: "USD",
    start_date: daysAgo(50),
    completed_at: daysAgo(35),
    expected_outcome: "Save 2+ hours per new client onboarding.",
  },
];

export function SampleDataLoader() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function loadSampleData() {
    if (!user) return;
    setLoading(true);

    try {
      // Insert clients
      const { data: insertedClients, error: cErr } = await supabase
        .from("clients")
        .insert(
          SAMPLE_CLIENTS.map((c) => ({
            ...c,
            user_id: user.id,
          })),
        )
        .select("id");
      if (cErr) throw cErr;

      const clientIds = insertedClients.map((c) => c.id);

      // Insert projects
      const projectRows = SAMPLE_PROJECTS(clientIds).map((p) => ({
        ...p,
        user_id: user.id,
      }));

      const { data: insertedProjects, error: pErr } = await supabase
        .from("projects")
        .insert(projectRows)
        .select("id, name, project_type, agreed_value, status");
      if (pErr) throw pErr;

      // Add sample transactions for completed/active client projects
      const txRows: Omit<TransactionInsert, "id" | "created_at" | "updated_at">[] = [];
      for (const p of insertedProjects) {
        const orig = projectRows.find((o) => o.name === p.name);
        if (!orig || orig.project_type !== "client") continue;
        const val = (orig as { agreed_value?: number }).agreed_value ?? 0;

        if (p.status === "completed") {
          // Fully paid
          txRows.push({
            project_id: p.id,
            user_id: user.id,
            transaction_type: "income",
            amount: val,
            currency: "USD",
            category: "Project completion",
            status: "completed",
            transaction_date: daysAgo(30),
          });
        } else if (p.status === "active" && val > 0) {
          // Partial payment
          txRows.push({
            project_id: p.id,
            user_id: user.id,
            transaction_type: "income",
            amount: Math.round(val * 0.3),
            currency: "USD",
            category: "Deposit",
            status: "completed",
            transaction_date: daysAgo(40),
          });
          txRows.push({
            project_id: p.id,
            user_id: user.id,
            transaction_type: "income",
            amount: Math.round(val * 0.7),
            currency: "USD",
            category: "Final payment",
            status: "expected",
            expected_date: daysFromNow(10),
            transaction_date: daysFromNow(10),
          });
        }
      }

      // Add sample expenses for investment projects
      for (const p of insertedProjects) {
        const orig = projectRows.find((o) => o.name === p.name);
        if (!orig || orig.project_type !== "investment") continue;
        const budget =
          (orig as { investment_budget?: number }).investment_budget ?? 0;
        if (budget > 0 && p.status !== "planned") {
          txRows.push({
            project_id: p.id,
            user_id: user.id,
            transaction_type: "expense",
            amount: Math.round(budget * 0.4),
            currency: "USD",
            category: "Tools & Software",
            status: "completed",
            transaction_date: daysAgo(20),
          });
        }
      }

      if (txRows.length > 0) {
        const { error: tErr } = await supabase
          .from("transactions")
          .insert(txRows);
        if (tErr) throw tErr;
      }

      // Add sample milestones for active client projects
      const msRows: Omit<MilestoneInsert, "id" | "created_at" | "updated_at">[] = [];
      for (const p of insertedProjects) {
        const orig = projectRows.find((o) => o.name === p.name);
        if (!orig || orig.project_type !== "client" || p.status === "planned")
          continue;
        msRows.push(
          {
            project_id: p.id,
            user_id: user.id,
            title: "Discovery & Research",
            status: "done",
            sort_order: 0,
            completed_at: daysAgo(20),
          },
          {
            project_id: p.id,
            user_id: user.id,
            title: "Design & Prototyping",
            status:
              p.status === "completed" ? "done" : "in_progress",
            sort_order: 1,
            due_date: daysFromNow(5),
          },
          {
            project_id: p.id,
            user_id: user.id,
            title: "Development & Testing",
            status: p.status === "completed" ? "done" : "not_started",
            sort_order: 2,
            due_date: daysFromNow(12),
          },
          {
            project_id: p.id,
            user_id: user.id,
            title: "Launch & Handoff",
            status: p.status === "completed" ? "done" : "not_started",
            sort_order: 3,
            due_date: daysFromNow(15),
          },
        );
      }

      if (msRows.length > 0) {
        const { error: mErr } = await supabase
          .from("milestones")
          .insert(msRows);
        if (mErr) throw mErr;
      }

      // Invalidate queries
      await queryClient.invalidateQueries();
      toast.success("Sample data loaded! Explore your new projects.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sample data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-6 text-center">
      <Sparkle className="h-8 w-8 text-primary/60" weight="duotone" />
      <div>
        <p className="text-sm font-medium">Load sample projects</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          Creates 12 sample projects (6 client + 6 investment) with clients,
          milestones, and transactions so you can explore the app.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={loadSampleData}
        disabled={loading}
        className="gap-1.5"
      >
        <Sparkle className="h-3.5 w-3.5" weight="duotone" />
        {loading ? "Loading…" : "Load sample data"}
      </Button>
    </div>
  );
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
