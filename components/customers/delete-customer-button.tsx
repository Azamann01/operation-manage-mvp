"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { deleteCustomer } from "@/lib/actions/customers";

export function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete customer "${name}"? This also removes their jobs.`)) {
          startTransition(async () => {
            await deleteCustomer(id);
            toast.success("Customer deleted", { description: name });
          });
        }
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
