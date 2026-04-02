"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LayoutList, Columns3 } from "lucide-react";
import { StoryFilters, type Filter } from "./story-filters";
import { StoriesTable } from "./stories-table";
import { KanbanBoard } from "./kanban-board";
import type { StoryDetail, Epic } from "@/lib/bmad/types";

interface StoriesViewProps {
  stories: StoryDetail[];
  epics: Epic[];
}

export function StoriesView({ stories, epics }: StoriesViewProps) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filter<string>[]>([]);

  const applyFilters = useCallback(
    (story: StoryDetail) => {
      for (const filter of filters) {
        if (filter.field === "status" && filter.values.length > 0) {
          const match =
            filter.operator === "is_not" || filter.operator === "is_not_any_of"
              ? !filter.values.includes(story.status)
              : filter.values.includes(story.status);
          if (!match) return false;
        }
        if (filter.field === "epicId" && filter.values.length > 0) {
          const match =
            filter.operator === "is_not" || filter.operator === "is_not_any_of"
              ? !filter.values.includes(story.epicId)
              : filter.values.includes(story.epicId);
          if (!match) return false;
        }
      }
      return true;
    },
    [filters]
  );

  const filtered = useMemo(() => {
    return stories.filter((story) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !story.title.toLowerCase().includes(q) &&
          !story.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return applyFilters(story);
    });
  }, [stories, search, applyFilters]);

  return (
    <div className="space-y-4" role="region" aria-label="Stories list">
      <div className="flex items-center justify-between gap-4">
        <StoryFilters
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFiltersChange={setFilters}
          epics={epics}
        />
        <div className="flex gap-1 border rounded-lg p-1" role="group" aria-label="Display mode">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("table")}
            className="gap-1.5"
            aria-label="Table view"
          >
            <LayoutList className="h-4 w-4" />
            <span className="hidden sm:inline">Table</span>
          </Button>
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("kanban")}
            className="gap-1.5"
            aria-label="Kanban view"
          >
            <Columns3 className="h-4 w-4" />
            <span className="hidden sm:inline">Board</span>
          </Button>
        </div>
      </div>

      {view === "table" ? (
        <StoriesTable stories={filtered} />
      ) : (
        <KanbanBoard stories={filtered} />
      )}
    </div>
  );
}
