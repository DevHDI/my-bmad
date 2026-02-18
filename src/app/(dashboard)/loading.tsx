import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mesh-gradient min-h-full">
      <div className="space-y-8 pt-6 lg:pt-8">
        {/* Header skeleton */}
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-1 h-5 w-80" />
        </div>
        {/* Content skeleton — generic card grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
