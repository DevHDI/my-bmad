"use client";

import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";

interface SegmentedProgressBarProps {
  percent: number;
  color?: string;
  className?: string;
}

const SEGMENT_WIDTH = 7;
const GAP = 3;

export function SegmentedProgressBar({
  percent,
  color = "bg-primary",
  className,
}: SegmentedProgressBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [totalSegments, setTotalSegments] = useState(60);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      const count = Math.floor((width + GAP) / (SEGMENT_WIDTH + GAP));
      setTotalSegments(Math.max(count, 10));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const filledCount = Math.round((percent / 100) * totalSegments);

  return (
    <div
      ref={containerRef}
      className={cn("flex w-full items-stretch h-5 gap-[3px]", className)}
    >
      {Array.from({ length: totalSegments }, (_, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-[2px]",
            i < filledCount ? color : "bg-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}
