"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJob } from "@/lib/actions/jobs";
import { formatGBP, calculateVat, calculateTotal } from "@/lib/currency";

export function JobFormDialog({
  customers,
  sites = [],
  variant = "default",
}: {
  customers: { id: string; name: string }[];
  sites?: { id: string; name: string; customerId: string }[];
  variant?: "default" | "compact";
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [vatExempt, setVatExempt] = useState(false);
  const [customerId, setCustomerId] = useState<string>("");
  const [siteId, setSiteId] = useState<string>("");
  const [state, formAction, pending] = useActionState(async (prevState: { error?: string } | undefined, formData: FormData) => {
    const result = await createJob(prevState, formData);
    if (!result.error) {
      setOpen(false);
      setCustomerId("");
      setSiteId("");
      toast.success("Job created", { description: formData.get("title") as string });
    } else {
      toast.error(result.error);
    }
    return result;
  }, undefined);

  const sitesForCustomer = sites.filter((s) => s.customerId === customerId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={
          variant === "compact"
            ? "inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/5 hover:text-white"
            : "inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        }
        aria-label={variant === "compact" ? "New job" : undefined}
      >
        <Plus className="h-4 w-4" /> {variant === "default" && "New job"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create job</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job title</Label>
            <Input id="title" name="title" required placeholder="HVAC servicing" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <Select
                name="customerId"
                required
                value={customerId}
                onValueChange={(value) => {
                  setCustomerId(value ?? "");
                  setSiteId("");
                }}
              >
                <SelectTrigger id="customerId" className="w-full">
                  <SelectValue placeholder="Select a customer">
                    {(value: string | null) =>
                      customers.find((c) => c.id === value)?.name ?? "Select a customer"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteId">Site</Label>
              <Select
                name="siteId"
                value={siteId}
                onValueChange={(value) => setSiteId(value ?? "")}
                disabled={!customerId || sitesForCustomer.length === 0}
              >
                <SelectTrigger id="siteId" className="w-full">
                  <SelectValue
                    placeholder={
                      !customerId
                        ? "Select customer first"
                        : sitesForCustomer.length === 0
                        ? "No sites"
                        : "Select a site"
                    }
                  >
                    {(value: string | null) =>
                      sitesForCustomer.find((s) => s.id === value)?.name ??
                      (!customerId
                        ? "Select customer first"
                        : sitesForCustomer.length === 0
                        ? "No sites"
                        : "Select a site")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {sitesForCustomer.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue="MEDIUM">
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      ({ LOW: "Low", MEDIUM: "Medium", HIGH: "High" })[value ?? "MEDIUM"] ??
                      "Medium"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled date</Label>
              <Input id="scheduledDate" name="scheduledDate" type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="price">Price (excl. VAT)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    £
                  </span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-6"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  name="vatExempt"
                  checked={vatExempt}
                  onChange={(e) => setVatExempt(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                VAT exempt
              </label>
            </div>
            {price && !Number.isNaN(Number(price)) && (
              <div className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground transition-all">
                <span>VAT (20%): {formatGBP(calculateVat(price, vatExempt))}</span>
                <span className="font-medium text-foreground">
                  Total: {formatGBP(calculateTotal(price, vatExempt))}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Job details..." />
          </div>
          {state?.error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create job
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
