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
import { useProjects } from "@/hooks/use-data";
import { useSaveTransaction } from "@/hooks/use-mutations";
import { todayISO } from "@/lib/format";
import {
  CURRENCIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  labelize,
  type Transaction,
  type TransactionStatus,
  type TransactionType,
} from "@/lib/types";

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  defaultProjectId,
  defaultType = "income",
  defaultStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  defaultProjectId?: string | null;
  defaultType?: TransactionType;
  defaultStatus?: TransactionStatus;
}) {
  const { data: projects = [] } = useProjects();
  const save = useSaveTransaction();
  const [values, setValues] = useState({
    project_id: defaultProjectId ?? "",
    transaction_type: defaultType as TransactionType,
    status: (defaultStatus ?? "completed") as TransactionStatus,
    amount: "",
    currency: "USD",
    category: "",
    transaction_date: todayISO(),
    expected_date: "",
    payment_method: "",
    reference: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (transaction) {
      setValues({
        project_id: transaction.project_id,
        transaction_type: transaction.transaction_type,
        status: transaction.status,
        amount: String(transaction.amount),
        currency: transaction.currency,
        category: transaction.category,
        transaction_date: transaction.transaction_date,
        expected_date: transaction.expected_date ?? "",
        payment_method: transaction.payment_method ?? "",
        reference: transaction.reference_number ?? "",
        notes: transaction.notes ?? "",
      });
    } else {
      const project = projects.find((p) => p.id === defaultProjectId) ?? projects[0];
      setValues({
        project_id: project?.id ?? "",
        transaction_type: defaultType,
        status: defaultStatus ?? "completed",
        amount: "",
        currency: project?.currency ?? "USD",
        category: defaultType === "income" ? "project_payment" : "software",
        transaction_date: todayISO(),
        expected_date: "",
        payment_method: "",
        reference: "",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction, defaultProjectId, defaultType, defaultStatus]);

  const isIncome = values.transaction_type === "income";
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function submit() {
    if (!values.project_id) {
      setError("Select a project.");
      return;
    }
    if (!values.amount || Number(values.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    if (!values.category) {
      setError("Select a category.");
      return;
    }
    await save.mutateAsync({
      ...(transaction ? { id: transaction.id } : {}),
      values: {
        project_id: values.project_id,
        transaction_type: values.transaction_type,
        status: values.status,
        amount: Number(values.amount),
        currency: values.currency,
        category: values.category,
        transaction_date: values.transaction_date || todayISO(),
        expected_date: values.status === "expected" ? values.expected_date || null : null,
        payment_method: values.payment_method || null,
        reference_number: values.reference || null,
        notes: values.notes || null,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit transaction" : "New transaction"}</DialogTitle>
          <DialogDescription>Record income received or an expense paid.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="t-project">Project *</Label>
            <Select
              value={values.project_id}
              onValueChange={(v) => {
                const p = projects.find((x) => x.id === v);
                setValues({ ...values, project_id: v, currency: p?.currency ?? values.currency });
              }}
            >
              <SelectTrigger id="t-project">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="t-type">Type</Label>
              <Select
                value={values.transaction_type}
                onValueChange={(v) =>
                  setValues({
                    ...values,
                    transaction_type: v as TransactionType,
                    category: v === "income" ? "project_payment" : "software",
                  })
                }
              >
                <SelectTrigger id="t-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-status">Status</Label>
              <Select
                value={values.status}
                onValueChange={(v) => setValues({ ...values, status: v as TransactionStatus })}
              >
                <SelectTrigger id="t-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expected">Expected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-amount">Amount *</Label>
              <Input
                id="t-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={values.amount}
                onChange={(e) => setValues({ ...values, amount: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-currency">Currency</Label>
              <Select
                value={values.currency}
                onValueChange={(v) => setValues({ ...values, currency: v })}
              >
                <SelectTrigger id="t-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-category">Category *</Label>
              <Select
                value={values.category}
                onValueChange={(v) => setValues({ ...values, category: v })}
              >
                <SelectTrigger id="t-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {labelize(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-date">
                {values.status === "expected" ? "Recorded date" : "Date"}
              </Label>
              <Input
                id="t-date"
                type="date"
                value={values.transaction_date}
                onChange={(e) => setValues({ ...values, transaction_date: e.target.value })}
              />
            </div>
            {values.status === "expected" ? (
              <div className="grid gap-2">
                <Label htmlFor="t-expected">Expected date</Label>
                <Input
                  id="t-expected"
                  type="date"
                  value={values.expected_date}
                  onChange={(e) => setValues({ ...values, expected_date: e.target.value })}
                />
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="t-method">Payment method</Label>
              <Input
                id="t-method"
                value={values.payment_method}
                onChange={(e) => setValues({ ...values, payment_method: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-ref">Reference</Label>
              <Input
                id="t-ref"
                value={values.reference}
                onChange={(e) => setValues({ ...values, reference: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="t-notes">Notes</Label>
            <Textarea
              id="t-notes"
              rows={2}
              value={values.notes}
              onChange={(e) => setValues({ ...values, notes: e.target.value })}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
