"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export function EmployeeProductivityChart({
  data,
}: {
  data: { name: string; completed: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="flex h-60 items-center justify-center text-sm text-muted-foreground">
        No completed jobs yet.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(99,102,241,0.06)" }}
          contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--border)" }}
        />
        <Bar dataKey="completed" fill="#6366f1" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
