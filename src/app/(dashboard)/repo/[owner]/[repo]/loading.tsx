import { Skeleton } from "@/components/ui/skeleton";

export default function RepoOverviewLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-18 w-18 rounded-full" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Velocity metrics skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Key artifacts skeleton */}
      <div className="glass-card p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Epics list skeleton */}
      <div className="glass-card p-6 space-y-3">
        <Skeleton className="h-6 w-24 mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>

      {/* Sprint summary skeleton */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-16 rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-1.5 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
