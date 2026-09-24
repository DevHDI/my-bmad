"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileWarning } from "lucide-react";
import type { ParseErrorEntry } from "@/lib/bmad/types";

interface ParseErrorsDialogProps {
  errors: ParseErrorEntry[];
}

export function ParseErrorsDialog({ errors }: ParseErrorsDialogProps) {
  if (errors.length === 0) return null;

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center text-warning hover:text-warning-foreground transition-colors duration-300"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${errors.length} file(s) with parsing errors`}
            >
              <AlertTriangle className="h-4 w-4" />
            </button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {errors.length} file(s) with parsing errors
        </TooltipContent>
      </Tooltip>
      <DialogContent className="glass-card max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Parsing Errors
          </DialogTitle>
          <DialogDescription>
            {errors.length} file(s) could not be parsed as BMAD content and are
            excluded from this project&apos;s metrics.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {errors.map((entry) => (
            <div
              key={`${entry.file}-${entry.contentType}`}
              className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3"
            >
              <FileWarning className="h-4 w-4 mt-0.5 shrink-0 text-warning" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-mono truncate" title={entry.file}>
                  {entry.file}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {entry.contentType}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {entry.error}
                </p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
