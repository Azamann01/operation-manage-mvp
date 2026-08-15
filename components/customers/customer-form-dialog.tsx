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
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import type { Customer } from "@prisma/client";

export function CustomerFormDialog({ customer }: { customer?: Customer }) {
  const [open, setOpen] = useState(false);
  const action = customer
    ? updateCustomer.bind(null, customer.id)
    : createCustomer;
  const isEdit = !!customer;
  const [state, formAction, pending] = useActionState(async (prevState: { error?: string } | undefined, formData: FormData) => {
    const result = await action(prevState, formData);
    if (!result.error) {
      setOpen(false);
      toast.success(isEdit ? "Customer updated" : "Customer added", {
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
        {isEdit ? <Pencil className="h-4 w-4" /> : (
          <>
            <Plus className="h-4 w-4" /> Add customer
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit customer" : "Add customer"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Company name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={customer?.name}
                placeholder="Acme Inc."
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                defaultValue={customer?.industry ?? ""}
                placeholder="Property management"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact name</Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={customer?.contactName ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={customer?.email ?? ""}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" defaultValue={customer?.address ?? ""} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" defaultValue={customer?.notes ?? ""} />
            </div>
          </div>
          {state?.error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
