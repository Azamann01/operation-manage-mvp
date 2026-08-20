import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { JobFormDialog } from "@/components/jobs/job-form-dialog";
import { statusVariant, priorityVariant, statusLabel } from "@/lib/job-badges";
import { formatGBP, calculateTotal } from "@/lib/currency";
import { formatJobNumber, isOverdue } from "@/lib/jobs";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Jobs" };

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const [jobs, customers, sites] = await Promise.all([
    db.job.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: "desc" },
      include: { customer: true, assignments: { include: { employee: true } } },
    }),
    db.customer.findMany({ orderBy: { name: "asc" } }),
    db.site.findMany({ orderBy: { name: "asc" } }),
  ]);

  const statuses = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            {jobs.length} job{jobs.length === 1 ? "" : "s"}
          </p>
        </div>
        <JobFormDialog customers={customers} sites={sites} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/jobs">
          <Badge variant={!status ? "default" : "outline"} className="cursor-pointer">
            All
          </Badge>
        </Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin/jobs?status=${s}`}>
            <Badge variant={status === s ? "default" : "outline"} className="cursor-pointer">
              {statusLabel[s as keyof typeof statusLabel]}
            </Badge>
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Briefcase className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No jobs found</p>
          <p className="mb-4 text-sm text-muted-foreground">
            {status ? "Try a different filter, or create a job." : "Create your first job to get started."}
          </p>
          <JobFormDialog customers={customers} sites={sites} />
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/admin/jobs/${job.id}`}
              prefetch={false}
              className="group flex flex-col gap-2 rounded-xl border bg-background p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md sm:flex-row sm:items-center sm:justify-between dark:hover:bg-indigo-950/20"
            >
              <div>
                <p className="flex items-center gap-2 font-medium transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  <span className="font-mono text-xs font-normal text-muted-foreground">
                    {formatJobNumber(job.number)}
                  </span>
                  {job.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {job.customer.name} ·{" "}
                  {job.assignments.length > 0
                    ? job.assignments.map((a) => a.employee.name).join(", ")
                    : "Unassigned"}
                  {job.scheduledDate && (
                    <> · {format(job.scheduledDate, "MMM d, yyyy")}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {job.price != null && (
                  <span className="text-sm font-medium tabular-nums">
                    {formatGBP(calculateTotal(job.price, job.vatExempt))}
                  </span>
                )}
                {isOverdue(job) && <Badge variant="destructive">Overdue</Badge>}
                <Badge variant={priorityVariant(job.priority)}>{job.priority}</Badge>
                <Badge variant={statusVariant(job.status)}>{statusLabel[job.status]}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
