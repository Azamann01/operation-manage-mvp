import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { StatusPieChart } from "@/components/dashboard/status-pie-chart";
import { EmployeeProductivityChart } from "@/components/dashboard/employee-productivity-chart";
import { Briefcase, Clock, CheckCircle2, TrendingUp, Banknote, Star } from "lucide-react";
import { calculateTotal } from "@/lib/currency";
import type { JobStatus } from "@prisma/client";

export default async function ReportsPage() {
  const [jobs, employees, completedJobs] = await Promise.all([
    db.job.findMany({ select: { status: true, priority: true } }),
    db.user.findMany({
      where: { role: "EMPLOYEE" },
      include: {
        assignments: {
          include: { job: { select: { status: true } } },
        },
      },
    }),
    db.job.findMany({
      where: { status: "COMPLETED" },
      select: { createdAt: true, completedAt: true, price: true, vatExempt: true, rating: true },
    }),
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

  const productivity = employees
    .map((e) => ({
      name: e.name,
      completed: e.assignments.filter((a) => a.job.status === "COMPLETED").length,
    }))
    .filter((e) => e.completed > 0)
    .sort((a, b) => b.completed - a.completed);

  const avgCompletionDays =
    completedJobs.length > 0
      ? completedJobs.reduce((sum, j) => {
          const completedAt = j.completedAt ?? j.createdAt;
          const days = (completedAt.getTime() - j.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedJobs.length
      : 0;

  const completionRate =
    jobs.length > 0 ? Math.round((counts.COMPLETED / jobs.length) * 100) : 0;

  const revenue = completedJobs.reduce(
    (sum, j) => sum + calculateTotal(j.price, j.vatExempt),
    0
  );

  const ratedJobs = completedJobs.filter((j) => j.rating != null);
  const avgRating =
    ratedJobs.length > 0
      ? ratedJobs.reduce((sum, j) => sum + (j.rating ?? 0), 0) / ratedJobs.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Performance and operational trends across your business.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Revenue (incl. VAT)"
          value={revenue}
          formatType="gbp"
          icon={Banknote}
          accent="emerald"
        />
        <KpiCard label="Total jobs" value={jobs.length} icon={Briefcase} accent="indigo" />
        <KpiCard
          label="Completion rate"
          value={completionRate}
          formatType="percent"
          icon={TrendingUp}
          accent="amber"
        />
        <KpiCard
          label="Avg. time to complete"
          value={avgCompletionDays}
          formatType="days"
          icon={Clock}
          accent="rose"
        />
        <KpiCard label="Completed jobs" value={counts.COMPLETED} icon={CheckCircle2} accent="indigo" />
        <KpiCard
          label="Customer rating"
          value={avgRating}
          formatType="rating"
          icon={Star}
          accent="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs by status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPieChart counts={counts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs completed by employee</CardTitle>
          </CardHeader>
          <CardContent>
            <EmployeeProductivityChart data={productivity} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
