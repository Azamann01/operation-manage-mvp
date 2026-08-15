"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateJobStatus } from "@/lib/actions/jobs";
import { statusLabel } from "@/lib/job-badges";
import type { JobStatus } from "@prisma/client";

const statuses: JobStatus[] = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

export function StatusControl({ jobId, status }: { jobId: string; status: JobStatus }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        onValueChange={(value) => {
          startTransition(async () => {
            await updateJobStatus(jobId, value as JobStatus);
            toast.success(`Status changed to ${statusLabel[value as JobStatus]}`);
          });
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue>
            {(value: JobStatus | null) => (value ? statusLabel[value] : "")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {statusLabel[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
