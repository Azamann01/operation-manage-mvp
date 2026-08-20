import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format, isToday } from "date-fns";
import { Briefcase, CheckCircle2, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusControl } from "@/components/jobs/status-control";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { statusVariant, priorityVariant, statusLabel } from "@/lib/job-badges";

export const metadata: Metadata = { title: "My Jobs" };

export default async function EmployeeDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const jobs = await db.job.findMany({
    where: { assignments: { some: { employeeId: session.user.id } } },
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "desc" }],
    include: { customer: true },
  });

  const todaysJobs = jobs.filter((j) => j.scheduledDate && isToday(j.scheduledDate));
  const activeJobs = jobs.filter((j) => !["COMPLETED", "CANCELLED"].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {session.user.name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s on your plate today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Scheduled today" value={todaysJobs.length} icon={Clock} accent="indigo" />
        <KpiCard label="Active jobs" value={activeJobs.length} icon={Briefcase} accent="amber" />
        <KpiCard label="Completed" value={completedJobs.length} icon={CheckCircle2} accent="emerald" />
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Today&apos;s jobs</h2>
        {todaysJobs.length === 0 ? (
          <p className="rounded-xl border border-dashed py-8 text-center text-sm text-muted-foreground">
            Nothing scheduled for today.
          </p>
        ) : (
          <div className="space-y-3">
            {todaysJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/employee/jobs/${job.id}`} prefetch={false} className="font-medium hover:underline">
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{job.customer.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={priorityVariant(job.priority)}>{job.priority}</Badge>
                    <StatusControl jobId={job.id} status={job.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">All my jobs</h2>
        {jobs.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">
            No jobs assigned to you yet.
          </p>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/employee/jobs/${job.id}`}
                prefetch={false}
                className="flex flex-col gap-2 rounded-xl border bg-background p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-indigo-950/20"
              >
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.customer.name}
                    {job.scheduledDate && <> · {format(job.scheduledDate, "MMM d, yyyy")}</>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={priorityVariant(job.priority)}>{job.priority}</Badge>
                  <Badge variant={statusVariant(job.status)}>{statusLabel[job.status]}</Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
