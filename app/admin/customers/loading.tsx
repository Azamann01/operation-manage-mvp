import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
