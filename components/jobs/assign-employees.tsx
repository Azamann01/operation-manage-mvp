"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { assignEmployees } from "@/lib/actions/jobs";

export function AssignEmployees({
  jobId,
  employees,
  assignedIds,
}: {
  jobId: string;
  employees: { id: string; name: string; jobTitle: string | null }[];
  assignedIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(assignedIds);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setSelected(assignedIds);
      }}
    >
      <DialogTrigger className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted">
        <UserCog className="h-4 w-4" /> Assign
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign employees</DialogTitle>
        </DialogHeader>
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {employees.length === 0 && (
            <p className="text-sm text-muted-foreground">No employees yet.</p>
          )}
          {employees.map((e) => {
            const checked = selected.includes(e.id);
            return (
              <label
                key={e.id}
                className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    setSelected((prev) =>
                      checked ? prev.filter((id) => id !== e.id) : [...prev, e.id]
                    )
                  }
                  className="h-4 w-4 rounded border-input"
                />
                <div>
                  <p className="text-sm font-medium">{e.name}</p>
                  {e.jobTitle && (
                    <p className="text-xs text-muted-foreground">{e.jobTitle}</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await assignEmployees(jobId, selected);
                setOpen(false);
                toast.success(
                  selected.length > 0
                    ? `Assigned ${selected.length} employee${selected.length === 1 ? "" : "s"}`
                    : "Employees unassigned"
                );
              });
            }}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
