import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, SeverityBadge } from "@/components/shared/status-badge";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";
import { ListOrdered } from "lucide-react";
import type { Defect } from "@/lib/bmad/types";

interface DefectDetailViewProps {
  defect: Defect;
}

export function DefectDetailView({ defect }: DefectDetailViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">
            {defect.id}
          </span>
          <h3 className="text-lg font-semibold">{defect.title}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SeverityBadge severity={defect.severity} />
          <StatusBadge status={defect.status} />
        </div>
      </div>

      {/* Description */}
      {defect.description && (
        <Card className="glass-card">
          <CardContent className="p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Description
            </h4>
            <MarkdownRenderer content={defect.description} />
          </CardContent>
        </Card>
      )}

      {/* Steps to Reproduce */}
      {defect.stepsToReproduce.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ListOrdered className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Steps to Reproduce
              </h4>
            </div>
            <ol className="space-y-2 list-decimal list-inside">
              {defect.stepsToReproduce.map((step, i) => (
                <li key={i} className="text-sm">
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Meta */}
      <Card className="glass-card">
        <CardContent className="p-5">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Details
          </h4>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Severity</dt>
              <dd className="mt-1"><SeverityBadge severity={defect.severity} compact /></dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1"><StatusBadge status={defect.status} compact /></dd>
            </div>
            {defect.storyId && (
              <div>
                <dt className="text-muted-foreground">Linked Story</dt>
                <dd className="mt-1 font-mono text-xs">S{defect.storyId}</dd>
              </div>
            )}
            {defect.epicId && (
              <div>
                <dt className="text-muted-foreground">Epic</dt>
                <dd className="mt-1 font-mono text-xs uppercase">{defect.epicId}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
