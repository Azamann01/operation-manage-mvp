"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createEmployee, updateEmployee } from "@/lib/actions/employees";
import type { User } from "@prisma/client";

export function EmployeeFormDialog({ employee }: { employee?: User }) {
  const [open, setOpen] = useState(false);
  const isEdit = !!employee;
  const action = isEdit ? updateEmployee.bind(null, employee.id) : createEmployee;
  const [state, formAction, pending] = useActionState(async (prevState: { error?: string } | undefined, formData: FormData) => {
    const result = await action(prevState, formData);
    if (!result.error) {
      setOpen(false);
      toast.success(isEdit ? "Employee updated" : "Employee added", {
        description: formData.get("name") as string,
      });
    } else {
      toast.error(result.error);
    }
    return result;
  }, undefined);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          isEdit
            ? "inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
            : "inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        }
      >
        {isEdit ? (
          <Pencil className="h-4 w-4" />
        ) : (
          <>
            <Plus className="h-4 w-4" /> Add employee
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit employee" : "Add employee"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" required defaultValue={employee?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job title</Label>
            <Input
              id="jobTitle"
              name="jobTitle"
              placeholder="Field Engineer"
              defaultValue={employee?.jobTitle ?? ""}
            />
          </div>
          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" name="password" type="password" required minLength={6} />
              </div>
            </>
          )}
          {state?.error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
