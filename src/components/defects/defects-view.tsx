"use client";

import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { DefectsTable } from "./defects-table";
import { StaggeredList, StaggeredItem } from "@/components/shared/staggered-list";
import type { Defect } from "@/lib/bmad/types";

interface DefectsViewProps {
  defects: Defect[];
}

export function DefectsView({ defects }: DefectsViewProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return defects;
    const q = search.toLowerCase();
    return defects.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.storyId.toLowerCase().includes(q)
    );
  }, [defects, search]);

  return (
    <StaggeredList className="space-y-4" role="region" aria-label="Defects list" staggerDelay={0.1}>
      <StaggeredItem>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search defects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </StaggeredItem>
      <StaggeredItem>
        <DefectsTable defects={filtered} />
      </StaggeredItem>
    </StaggeredList>
  );
}
