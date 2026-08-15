"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { toggleEmployeeActive } from "@/lib/actions/employees";

export function ToggleActiveButton({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleEmployeeActive(id, !active);
          toast.success(active ? "Employee deactivated" : "Employee reactivated");
        })
      }
      className={
        active
          ? "inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
          : "inline-flex h-8 items-center rounded-md border border-emerald-300 px-3 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
      }
    >
      {pending && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
      {active ? "Deactivate" : "Reactivate"}
    </button>
  );
}
