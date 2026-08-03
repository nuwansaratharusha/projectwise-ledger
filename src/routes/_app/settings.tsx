import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useProfile, useUpdateProfile } from "@/hooks/use-data";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv } from "@/lib/csv";
import { useProjects, useClients, useTransactions, useMilestones } from "@/hooks/use-data";
import { toast } from "sonner";
import { Moon, Sun, DownloadSimple, SignOut, Trash } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { theme, toggle } = useTheme();
  const queryClient = useQueryClient();

  const { data: projects = [] } = useProjects();
  const { data: clients = [] } = useClients();
  const { data: transactions = [] } = useTransactions();
  const { data: milestones = [] } = useMilestones();

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setBusinessName(profile.business_name ?? "");
      setCurrency(profile.default_currency ?? "USD");
      setTimezone(profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
  }, [profile]);

  async function handleSave() {
    setSaving(true);
    updateProfile.mutate(
      {
        full_name: fullName || "",
        business_name: businessName || "",
        default_currency: currency,
        timezone,
      },
      {
        onSuccess: () => {
          toast.success("Profile updated.");
          setSaving(false);
        },
        onError: () => {
          toast.error("Failed to update profile.");
          setSaving(false);
        },
      },
    );
  }

  function exportAllData() {
    const pRows = projects.map((p) => ({
      Name: p.name,
      Type: p.project_type,
      Status: p.status,
      "Start Date": p.start_date ?? "",
      "Target Date": p.target_date ?? "",
    }));
    downloadCsv("all-projects.csv", pRows);

    const cRows = clients.map((c) => ({
      Name: c.name,
      Company: c.company_name ?? "",
      Email: c.email ?? "",
    }));
    downloadCsv("all-clients.csv", cRows);

    const tRows = transactions.map((t) => ({
      Date: t.transaction_date,
      Type: t.transaction_type,
      Category: t.category,
      Amount: t.amount,
      Status: t.status,
    }));
    downloadCsv("all-transactions.csv", tRows);

    const mRows = milestones.map((m) => ({
      Title: m.title,
      Status: m.status,
      "Due Date": m.due_date ?? "",
      Amount: m.billable_amount ?? "",
    }));
    downloadCsv("all-milestones.csv", mRows);

    toast.success("All data exported as CSV files.");
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <PageHeader title="Settings" description="Manage your profile and preferences." />

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Profile</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="set-email">Email</Label>
            <Input
              id="set-email"
              disabled
              value={user?.email ?? ""}
              className="bg-muted"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="set-name">Full name</Label>
            <Input
              id="set-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="set-biz">Business name</Label>
            <Input
              id="set-biz"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="set-currency">Default currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="set-currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["USD", "EUR", "GBP", "AUD", "CAD", "LKR", "INR", "JPY"].map(
                  (c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="set-tz">Timezone</Label>
            <Input
              id="set-tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </section>

      {/* Theme */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <Button variant="outline" onClick={toggle} className="gap-2">
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          Switch to {theme === "dark" ? "light" : "dark"} mode
        </Button>
      </section>

      {/* Export */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Data Export</h2>
        <p className="text-sm text-muted-foreground">
          Download all your data as CSV files.
        </p>
        <Button variant="outline" onClick={exportAllData} className="gap-2">
          <DownloadSimple className="h-4 w-4" weight="duotone" />
          Export all data
        </Button>
      </section>

      {/* Danger zone */}
      <section className="space-y-3 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Delete all projects, clients, transactions, milestones and notes. This cannot be undone.
        </p>
        <Button
          variant="outline"
          className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={async () => {
            if (!confirm("Are you sure? This will permanently delete ALL your data.")) return;
            try {
              const uid = (await supabase.auth.getUser()).data.user?.id;
              if (!uid) return;
              await supabase.from("activity_logs").delete().eq("user_id", uid);
              await supabase.from("project_notes").delete().eq("user_id", uid);
              await supabase.from("milestones").delete().eq("user_id", uid);
              await supabase.from("transactions").delete().eq("user_id", uid);
              await supabase.from("projects").delete().eq("user_id", uid);
              await supabase.from("clients").delete().eq("user_id", uid);
              queryClient.invalidateQueries();
              toast.success("All data cleared.");
            } catch {
              toast.error("Failed to clear data.");
            }
          }}
        >
          <Trash className="h-4 w-4" weight="duotone" />
          Delete all data
        </Button>
      </section>

      {/* Sign out */}
      <section className="space-y-3 border-t border-border pt-6">
        <Button
          variant="outline"
          className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => supabase.auth.signOut()}
        >
          <SignOut className="h-4 w-4" weight="duotone" />
          Sign out
        </Button>
      </section>
    </div>
  );
}
