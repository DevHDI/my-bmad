import { Check, Loader2, Circle } from "lucide-react";
import { EpicTimelineCard } from "./epic-timeline-card";
import type { Epic } from "@/lib/bmad/types";

interface EpicsTimelineProps {
  epics: Epic[];
  onSelectEpic?: (epicId: string) => void;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "done") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
        <Check className="h-4 w-4" strokeWidth={3} />
      </div>
    );
  }
  if (status === "in-progress") {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-500 bg-background">
        <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-muted-foreground/30 bg-background">
      <Circle className="h-3 w-3 text-muted-foreground/40" />
    </div>
  );
}

function connectorColor(status: string) {
  if (status === "done") return "bg-emerald-500";
  if (status === "in-progress") return "bg-blue-500/40";
  return "bg-border";
}

export function EpicsTimeline({ epics, onSelectEpic }: EpicsTimelineProps) {
  if (epics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No epic found
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Epics will appear here once defined in the planning artifacts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {epics.map((epic, i) => (
        <div key={epic.id} className="flex gap-4">
          {/* Stepper column */}
          <div className="flex flex-col items-center">
            {/* Top connector */}
            <div
              className={`w-0.5 flex-1 ${i === 0 ? "bg-transparent" : connectorColor(epics[i - 1].status)}`}
            />
            {/* Status icon */}
            <StatusIcon status={epic.status} />
            {/* Bottom connector */}
            <div
              className={`w-0.5 flex-1 ${i === epics.length - 1 ? "bg-transparent" : connectorColor(epic.status)}`}
            />
          </div>

          {/* Card */}
          <div className="flex-1 py-2">
            <EpicTimelineCard
              epic={epic}
              onClick={onSelectEpic ? () => onSelectEpic(epic.id) : undefined}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
