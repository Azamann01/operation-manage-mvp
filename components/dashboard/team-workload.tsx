import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TeamWorkload({
  employees,
}: {
  employees: { id: string; name: string; jobTitle: string | null; openJobs: number }[];
}) {
  if (employees.length === 0) {
    return <p className="text-sm text-muted-foreground">No active employees yet.</p>;
  }

  const max = Math.max(1, ...employees.map((e) => e.openJobs));

  return (
    <ul className="space-y-4">
      {employees.map((e) => (
        <li key={e.id} className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-indigo-500/10 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {initials(e.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{e.name}</p>
            <p className="truncate text-xs text-muted-foreground">{e.jobTitle || "Employee"}</p>
          </div>
          <div className="hidden w-28 shrink-0 sm:block">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${(e.openJobs / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="w-4 shrink-0 text-right text-sm font-medium tabular-nums">
            {e.openJobs}
          </span>
        </li>
      ))}
    </ul>
  );
}
