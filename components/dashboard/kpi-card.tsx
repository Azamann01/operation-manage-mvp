import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";

export function KpiCard({
  label,
  value,
  formatType,
  icon: Icon,
  trend,
  accent,
}: {
  label: string;
  value: number;
  formatType?: "number" | "gbp" | "percent" | "days" | "hours" | "rating";
  icon: LucideIcon;
  trend?: string;
  accent?: "indigo" | "emerald" | "amber" | "rose";
}) {
  const accentClass = {
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  }[accent ?? "indigo"];

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            <AnimatedNumber value={value} formatType={formatType} />
          </p>
          {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
            accentClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
