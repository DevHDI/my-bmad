import { Skeleton } from "@/components/ui/skeleton";

export default function DefectsLoading() {
  return (
    <div className="space-y-6 py-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <div className="flex items-center gap-4 border-b border-border/50 bg-muted/30 px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20 ml-auto" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/50 px-4 py-3.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-5 w-16 rounded-full ml-auto" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
