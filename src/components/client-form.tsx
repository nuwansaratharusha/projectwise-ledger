import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateClient, useUpdateClient } from "@/hooks/use-mutations";
import type { Client } from "@/lib/types";

export function ClientFormDialog({
  open,
  onOpenChange,
  client,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onCreated?: (client: Client) => void;
}) {
  const create = useCreateClient();
  const update = useUpdateClient();
  const [values, setValues] = useState({
    name: "",
    company_name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    notes: "",
    status: "active" as Client["status"],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues({
      name: client?.name ?? "",
      company_name: client?.company_name ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      website: client?.website ?? "",
      address: client?.address ?? "",
      notes: client?.notes ?? "",
      status: client?.status ?? "active",
    });
  }, [open, client]);

  const saving = create.isPending || update.isPending;

  async function submit() {
    if (!values.name.trim()) {
      setError("Client name is required.");
      return;
    }
    if (values.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) {
      setError("Enter a valid email address.");
      return;
    }
    const payload = {
      name: values.name.trim(),
      company_name: values.company_name || null,
      email: values.email || null,
      phone: values.phone || null,
      website: values.website || null,
      address: values.address || null,
      notes: values.notes || null,
      status: values.status,
    };
    if (client) {
      await update.mutateAsync({ id: client.id, values: payload });
    } else {
      const created = await create.mutateAsync(payload);
      onCreated?.(created as Client);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? "Edit client" : "New client"}</DialogTitle>
          <DialogDescription>Client contact details and status.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="client-name">Client name *</Label>
            <Input
              id="client-name"
              value={values.name}
              onChange={(e) => setValues({ ...values, name: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="client-company">Company</Label>
              <Input
                id="client-company"
                value={values.company_name}
                onChange={(e) => setValues({ ...values, company_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client-status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(v) => setValues({ ...values, status: v as Client["status"] })}
              >
                <SelectTrigger id="client-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                value={values.email}
                onChange={(e) => setValues({ ...values, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client-phone">Phone</Label>
              <Input
                id="client-phone"
                value={values.phone}
                onChange={(e) => setValues({ ...values, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client-website">Website</Label>
              <Input
                id="client-website"
                value={values.website}
                onChange={(e) => setValues({ ...values, website: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="client-address">Address</Label>
              <Input
                id="client-address"
                value={values.address}
                onChange={(e) => setValues({ ...values, address: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="client-notes">Notes</Label>
            <Textarea
              id="client-notes"
              rows={3}
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : "Save client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
