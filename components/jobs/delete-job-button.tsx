"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteJobButton({
  id,
  title,
  onDelete,
}: {
  id: string;
  title: string;
  onDelete: (id: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-md border border-destructive/30 px-3 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete job "${title}"? This cannot be undone.`)) {
          startTransition(async () => {
            await onDelete(id);
            toast.success("Job deleted", { description: title });
            router.push("/admin/jobs");
          });
        }
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Delete
    </button>
  );
}
