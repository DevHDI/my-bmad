import { Skeleton } from "@/components/ui/skeleton";

export default function StoriesLoading() {
  return (
    <div className="space-y-6 py-8">
      {/* Title + subtitle */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Filters bar + view toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border/50 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-border/50 bg-muted/30 px-4 py-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border/50 px-4 py-3.5"
          >
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-28 ml-auto" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
