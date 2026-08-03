import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Plus,
  FolderSimple,
  Users,
  CreditCard,
  Receipt,
  Flag,
} from "@phosphor-icons/react";
import { ProjectFormDialog } from "./project-form";
import { ClientFormDialog } from "./client-form";
import { TransactionFormDialog } from "./transaction-form";

export function QuickActions() {
  const [projectOpen, setProjectOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" className="h-7 gap-1 px-2.5 text-xs font-medium">
            <Plus className="h-3.5 w-3.5" weight="bold" />
            <span className="hidden sm:inline">Create</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setProjectOpen(true)}>
            <FolderSimple className="mr-2 h-4 w-4" weight="duotone" />
            New project
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setClientOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            New client
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPaymentOpen(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Record payment
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setExpenseOpen(true)}>
            <Receipt className="mr-2 h-4 w-4" />
            Record expense
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectFormDialog open={projectOpen} onOpenChange={setProjectOpen} />
      <ClientFormDialog open={clientOpen} onOpenChange={setClientOpen} />
      <TransactionFormDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        defaultType="income"
      />
      <TransactionFormDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        defaultType="expense"
      />
    </>
  );
}
