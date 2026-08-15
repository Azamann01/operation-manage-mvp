"use client";

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { statusLabel } from "@/lib/job-badges";
import type { JobStatus } from "@prisma/client";

const colors: Record<JobStatus, string> = {
  PENDING: "#94a3b8",
  ASSIGNED: "#6366f1",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#10b981",
  CANCELLED: "#f43f5e",
};

export function StatusPieChart({ counts }: { counts: Record<JobStatus, number> }) {
  const data = (Object.keys(counts) as JobStatus[])
    .map((status) => ({ status, name: statusLabel[status], value: counts[status] }))
    .filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <p className="flex h-60 items-center justify-center text-sm text-muted-foreground">
        No job data yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.status} fill={colors[d.status]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--border)" }} />
        <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
