import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusControl } from "@/components/jobs/status-control";
import { AssignEmployees } from "@/components/jobs/assign-employees";
import { JobNoteForm } from "@/components/jobs/job-note-form";
import { ActivityTimeline } from "@/components/jobs/activity-timeline";
import { DeleteJobButton } from "@/components/jobs/delete-job-button";
import { PricingCard } from "@/components/jobs/pricing-card";
import { JobRating } from "@/components/jobs/job-rating";
import { deleteJob } from "@/lib/actions/jobs";
import { priorityVariant } from "@/lib/job-badges";
import { formatJobNumber, isOverdue } from "@/lib/jobs";

export default async function AdminJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [job, employees] = await Promise.all([
    db.job.findUnique({
      where: { id },
      include: {
        customer: true,
        site: true,
        assignments: { include: { employee: true } },
        activities: { orderBy: { createdAt: "desc" }, include: { author: true } },
      },
    }),
    db.user.findMany({ where: { role: "EMPLOYEE", active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/jobs"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="font-mono text-sm font-normal text-muted-foreground">
                {formatJobNumber(job.number)}
              </span>
              <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
              <Badge variant={priorityVariant(job.priority)}>{job.priority}</Badge>
              {isOverdue(job) && <Badge variant="destructive">Overdue</Badge>}
            </div>
            <Link
              href={`/admin/customers/${job.customerId}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              {job.customer.name}
            </Link>
            {job.site && (
              <span className="text-sm text-muted-foreground"> · {job.site.name}</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AssignEmployees
              jobId={job.id}
              employees={employees}
              assignedIds={job.assignments.map((a) => a.employeeId)}
            />
            <StatusControl jobId={job.id} status={job.status} />
            <DeleteJobButton id={job.id} title={job.title} onDelete={deleteJob} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {job.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <JobNoteForm jobId={job.id} />
              <ActivityTimeline activities={job.activities} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Scheduled:{" "}
                {job.scheduledDate ? format(job.scheduledDate, "MMM d, yyyy") : "Not set"}
              </div>
              <div
                className={
                  isOverdue(job)
                    ? "flex items-center gap-2 font-medium text-destructive"
                    : "flex items-center gap-2 text-muted-foreground"
                }
              >
                <Calendar className="h-4 w-4" />
                Due: {job.dueDate ? format(job.dueDate, "MMM d, yyyy") : "Not set"}
                {isOverdue(job) && " (overdue)"}
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <User className="mt-0.5 h-4 w-4" />
                <span>
                  {job.assignments.length > 0
                    ? job.assignments.map((a) => a.employee.name).join(", ")
                    : "Unassigned"}
                </span>
              </div>
            </CardContent>
          </Card>

          <PricingCard price={job.price} vatExempt={job.vatExempt} />

          {job.status === "COMPLETED" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer rating</CardTitle>
              </CardHeader>
              <CardContent>
                <JobRating jobId={job.id} rating={job.rating} editable />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
