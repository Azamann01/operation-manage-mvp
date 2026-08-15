import Link from "next/link";
import { format } from "date-fns";
import { ChevronRight, PartyPopper } from "lucide-react";
import { formatJobNumber, isOverdue } from "@/lib/jobs";
import { cn } from "@/lib/utils";
import type { JobStatus, JobPriority } from "@prisma/client";

export type AttentionJob = {
  id: string;
  number: number;
  title: string;
  status: JobStatus;
  priority: JobPriority;
  dueDate: Date | null;
  customer: { name: string };
  assignments: { employee: { name: string } }[];
};

export function NeedsAttention({ jobs }: { jobs: AttentionJob[] }) {
  const items = jobs
    .map((job) => ({ job, overdue: isOverdue(job) }))
    .filter(({ job, overdue }) => overdue || job.priority === "HIGH")
    .sort((a, b) => (a.overdue === b.overdue ? 0 : a.overdue ? -1 : 1))
    .slice(0, 6);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <PartyPopper className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Nothing urgent — all caught up.
        </p>
      </div>
    );
  }

  return (
    <ol className="divide-y">
      {items.map(({ job, overdue }) => (
        <li key={job.id}>
          <Link
            href={`/admin/jobs/${job.id}`}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/40"
          >
            <span
              className={cn(
                "h-full min-h-10 w-1 shrink-0 rounded-full",
                overdue ? "bg-destructive" : "bg-amber-400"
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{job.title}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                    overdue
                      ? "bg-destructive/10 text-destructive"
                      : "bg-amber-400/15 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {overdue ? "Urgent" : "High"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatJobNumber(job.number)} · {job.customer.name}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">
                {job.assignments.length > 0
                  ? job.assignments.map((a) => a.employee.name).join(", ")
                  : "Unassigned"}
              </p>
              <p
                className={cn(
                  "text-xs font-medium",
                  overdue ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {job.dueDate
                  ? overdue
                    ? `Overdue · ${format(job.dueDate, "MMM d")}`
                    : format(job.dueDate, "MMM d, yyyy")
                  : "No due date"}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ol>
  );
}
