import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}
