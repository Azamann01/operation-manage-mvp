"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { deleteSite } from "@/lib/actions/sites";

export function DeleteSiteButton({
  id,
  customerId,
  name,
}: {
  id: string;
  customerId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete site "${name}"?`)) {
          startTransition(async () => {
            await deleteSite(id, customerId);
            toast.success("Site deleted", { description: name });
          });
        }
      }}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
