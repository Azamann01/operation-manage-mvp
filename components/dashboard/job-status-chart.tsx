"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { statusLabel } from "@/lib/job-badges";
import type { JobStatus } from "@prisma/client";

const colors: Record<JobStatus, string> = {
  PENDING: "#94a3b8",
  ASSIGNED: "#6366f1",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#10b981",
  CANCELLED: "#f43f5e",
};

export function JobStatusChart({ counts }: { counts: Record<JobStatus, number> }) {
  const data = (Object.keys(counts) as JobStatus[]).map((status) => ({
    status,
    label: statusLabel[status],
    count: counts[status],
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "rgba(99,102,241,0.06)" }}
          contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--border)" }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.status} fill={colors[d.status]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
