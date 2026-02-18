import { Skeleton } from "@/components/ui/skeleton";

export default function EpicsLoading() {
  return (
    <div className="space-y-6 py-8">
      {/* Title + progress ring */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>

      {/* Timeline skeleton cards */}
      <div className="relative space-y-4">
        {/* Timeline line */}
        <div className="absolute left-4.5 top-4 bottom-4 w-0.5 bg-border" />

        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="relative pl-12">
            {/* Timeline dot */}
            <div className="absolute left-2.5 top-6 flex h-4 w-4 items-center justify-center">
              <Skeleton className="h-3 w-3 rounded-full" />
            </div>
            {/* Card skeleton */}
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="pt-2">
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
