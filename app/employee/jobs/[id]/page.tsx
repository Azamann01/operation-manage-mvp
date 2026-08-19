import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusControl } from "@/components/jobs/status-control";
import { JobNoteForm } from "@/components/jobs/job-note-form";
import { ActivityTimeline } from "@/components/jobs/activity-timeline";
import { PricingCard } from "@/components/jobs/pricing-card";
import { JobRating } from "@/components/jobs/job-rating";
import { priorityVariant } from "@/lib/job-badges";
import { formatJobNumber, isOverdue } from "@/lib/jobs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await db.job.findUnique({ where: { id }, select: { title: true } });
  return { title: job?.title ?? "Job" };
}

export default async function EmployeeJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  const job = await db.job.findUnique({
    where: { id },
    include: {
      customer: true,
      site: true,
      assignments: { include: { employee: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { author: true } },
    },
  });

  if (!job) notFound();

  const isAssigned = job.assignments.some((a) => a.employeeId === session.user.id);
  if (session.user.role !== "ADMIN" && !isAssigned) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/employee"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my jobs
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
            <p className="text-sm text-muted-foreground">
              {job.customer.name}
              {job.site && <> · {job.site.name}</>}
            </p>
          </div>
          <StatusControl jobId={job.id} status={job.status} />
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
              <p className="text-xs text-muted-foreground">
                {job.customer.address}
              </p>
            </CardContent>
          </Card>

          <PricingCard price={job.price} vatExempt={job.vatExempt} />

          {job.status === "COMPLETED" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer rating</CardTitle>
              </CardHeader>
              <CardContent>
                <JobRating jobId={job.id} rating={job.rating} editable={false} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
