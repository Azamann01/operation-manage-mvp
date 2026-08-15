import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  LogIn,
  LogOut,
  CalendarClock,
  ShieldAlert,
} from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { JobStatusChart } from "@/components/dashboard/job-status-chart";
import { NeedsAttention, type AttentionJob } from "@/components/dashboard/needs-attention";
import { TeamWorkload } from "@/components/dashboard/team-workload";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { statusLabel, statusVariant, priorityVariant } from "@/lib/job-badges";
import { OPEN_STATUSES, isOverdue, isDueToday, isCompletedOnTime } from "@/lib/jobs";
import type { JobStatus, ActivityType } from "@prisma/client";

const activityIcon: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  STATUS_CHANGE: CheckCircle2,
  NOTE: MessageSquare,
  CHECK_IN: LogIn,
  CHECK_OUT: LogOut,
};

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  const [
    jobs,
    openJobs,
    employees,
    recentActivity,
    upcomingJobs,
    weekCompleted,
    prevWeekCompletedCount,
    completedThisMonth,
    unassigned,
  ] = await Promise.all([
    db.job.findMany({ select: { status: true } }),
    db.job.findMany({
      where: { status: { in: OPEN_STATUSES } },
      include: { customer: true, assignments: { include: { employee: true } } },
    }),
    db.user.findMany({ where: { role: "EMPLOYEE", active: true }, orderBy: { name: "asc" } }),
    db.jobActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { author: true, job: true },
    }),
    db.job.findMany({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        scheduledDate: { gte: new Date() },
      },
      orderBy: { scheduledDate: "asc" },
      take: 5,
      include: { customer: true, assignments: { include: { employee: true } } },
    }),
    db.job.findMany({
      where: { status: "COMPLETED", completedAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, completedAt: true, dueDate: true, rating: true },
    }),
    db.job.count({
      where: { status: "COMPLETED", completedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
    }),
    db.job.count({
      where: { status: "COMPLETED", completedAt: { gte: startOfMonth } },
    }),
    db.job.count({ where: { status: "PENDING" } }),
  ]);

  const counts = jobs.reduce(
    (acc, j) => {
      acc[j.status] = (acc[j.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<JobStatus, number>
  );
  const allStatuses: JobStatus[] = ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
  for (const s of allStatuses) counts[s] = counts[s] ?? 0;

  const dueTodayCount = openJobs.filter(isDueToday).length;
  const overdueCount = openJobs.filter(isOverdue).length;

  const workloadMap = new Map<string, number>();
  for (const job of openJobs) {
    for (const a of job.assignments) {
      workloadMap.set(a.employeeId, (workloadMap.get(a.employeeId) ?? 0) + 1);
    }
  }
  const workload = employees
    .map((e) => ({
      id: e.id,
      name: e.name,
      jobTitle: e.jobTitle,
      openJobs: workloadMap.get(e.id) ?? 0,
    }))
    .sort((a, b) => b.openJobs - a.openJobs)
    .slice(0, 5);

  const attentionJobs: AttentionJob[] = openJobs.map((j) => ({
    id: j.id,
    number: j.number,
    title: j.title,
    status: j.status,
    priority: j.priority,
    dueDate: j.dueDate,
    customer: { name: j.customer.name },
    assignments: j.assignments.map((a) => ({ employee: { name: a.employee.name } })),
  }));

  const onTimeCount = weekCompleted.filter(
    (j) => j.completedAt && isCompletedOnTime(j.dueDate, j.completedAt)
  ).length;
  const onTimePct = weekCompleted.length > 0 ? (onTimeCount / weekCompleted.length) * 100 : 0;
  const avgCompletionHours =
    weekCompleted.length > 0
      ? weekCompleted.reduce(
          (sum, j) =>
            sum + ((j.completedAt?.getTime() ?? j.createdAt.getTime()) - j.createdAt.getTime()) / 3600000,
          0
        ) / weekCompleted.length
      : 0;
  const ratedThisWeek = weekCompleted.filter((j) => j.rating != null);
  const avgRatingWeek =
    ratedThisWeek.length > 0
      ? ratedThisWeek.reduce((sum, j) => sum + (j.rating ?? 0), 0) / ratedThisWeek.length
      : 0;
  const trendPct =
    prevWeekCompletedCount > 0
      ? ((weekCompleted.length - prevWeekCompletedCount) / prevWeekCompletedCount) * 100
      : weekCompleted.length > 0
      ? 100
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Operational overview across customers, jobs, and your team.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open jobs" value={openJobs.length} icon={Briefcase} accent="indigo" />
        <KpiCard label="Due today" value={dueTodayCount} icon={CalendarClock} accent="amber" />
        <KpiCard label="Overdue" value={overdueCount} icon={ShieldAlert} accent="rose" />
        <KpiCard
          label="Completed this month"
          value={completedThisMonth}
          icon={CheckCircle2}
          accent="emerald"
        />
      </div>

      {unassigned > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          {unassigned} job{unassigned === 1 ? "" : "s"} pending assignment.{" "}
          <Link href="/admin/jobs?status=PENDING" className="font-medium underline">
            Review now
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Needs attention</CardTitle>
            <Link
              href="/admin/jobs"
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View all jobs →
            </Link>
          </CardHeader>
          <CardContent>
            <NeedsAttention jobs={attentionJobs} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Weekly performance</CardTitle>
            <Link
              href="/admin/reports"
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Reports →
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {weekCompleted.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs completed in the last 7 days.</p>
            ) : (
              <ProgressRing
                percent={onTimePct}
                label="On-time completion"
                sublabel={`${onTimeCount} of ${weekCompleted.length} completed on time`}
              />
            )}
            <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
              <div>
                <p className="text-lg font-semibold tabular-nums">
                  {avgCompletionHours.toFixed(1)}h
                </p>
                <p className="text-xs text-muted-foreground">Avg. completion</p>
              </div>
              <div>
                <p className="text-lg font-semibold tabular-nums">
                  {ratedThisWeek.length > 0 ? `${avgRatingWeek.toFixed(1)}/5` : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Customer rating</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Performance trend{" "}
              <span
                className={trendPct >= 0 ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium text-destructive"}
              >
                {trendPct >= 0 ? "↑" : "↓"} {Math.abs(Math.round(trendPct))}%
              </span>{" "}
              vs last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs by status</CardTitle>
          </CardHeader>
          <CardContent>
            <JobStatusChart counts={counts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Team workload</CardTitle>
            <Link
              href="/admin/employees"
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Manage team →
            </Link>
          </CardHeader>
          <CardContent>
            <TeamWorkload employees={workload} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ol className="space-y-4">
                {recentActivity.map((a) => {
                  const Icon = activityIcon[a.type];
                  return (
                    <li key={a.id} className="flex gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/jobs/${a.jobId}`}
                          className="text-sm hover:underline"
                        >
                          {a.description}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {a.author.name} on {a.job.title} ·{" "}
                          {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled ahead.</p>
          ) : (
            <div className="space-y-2">
              {upcomingJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/admin/jobs/${job.id}`}
                  className="flex flex-col gap-2 rounded-lg border p-3 hover:border-indigo-300 hover:bg-indigo-50/50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-indigo-950/20"
                >
                  <div>
                    <p className="text-sm font-medium">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.customer.name} ·{" "}
                      {job.scheduledDate && format(job.scheduledDate, "MMM d, yyyy")} ·{" "}
                      {job.assignments.length > 0
                        ? job.assignments.map((a) => a.employee.name).join(", ")
                        : "Unassigned"}
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
        </CardContent>
      </Card>
    </div>
  );
}
