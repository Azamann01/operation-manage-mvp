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
import { createSite, updateSite } from "@/lib/actions/sites";
import type { Site } from "@prisma/client";

export function SiteFormDialog({
  customerId,
  site,
}: {
  customerId: string;
  site?: Site;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = !!site;
  const action = isEdit
    ? updateSite.bind(null, site.id, customerId)
    : createSite.bind(null, customerId);
  const [state, formAction, pending] = useActionState(async (prevState: { error?: string } | undefined, formData: FormData) => {
    const result = await action(prevState, formData);
    if (!result.error) {
      setOpen(false);
      toast.success(isEdit ? "Site updated" : "Site added", {
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
            ? "inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted"
            : "inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium hover:bg-muted"
        }
      >
        {isEdit ? (
          <Pencil className="h-3.5 w-3.5" />
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" /> Add site
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit site" : "Add site"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Site name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={site?.name}
              placeholder="Main warehouse"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={site?.address ?? ""} />
          </div>
          {state?.error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add site"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
