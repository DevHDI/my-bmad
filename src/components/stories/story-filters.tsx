"use client";

import { Search } from "lucide-react";
import {
  Filters,
  createFilter,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters";
import { Input } from "@/components/ui/input";
import type { Epic } from "@/lib/bmad/types";

const STATUS_OPTIONS = [
  { value: "done", label: "Done" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "In Review" },
  { value: "blocked", label: "Blocked" },
  { value: "ready-for-dev", label: "Ready for Dev" },
  { value: "backlog", label: "Backlog" },
];

interface StoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filters: Filter<string>[];
  onFiltersChange: (filters: Filter<string>[]) => void;
  epics: Epic[];
}

export function StoryFilters({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  epics,
}: StoryFiltersProps) {
  const fields: FilterFieldConfig<string>[] = [
    {
      key: "status",
      label: "Status",
      type: "multiselect",
      options: STATUS_OPTIONS,
    },
    {
      key: "epicId",
      label: "Epic",
      type: "select",
      options: epics.map((e) => ({
        value: e.id,
        label: `Epic ${e.id}: ${e.title}`,
      })),
    },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search stories..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Filters
        filters={filters}
        fields={fields}
        onChange={onFiltersChange}
        size="sm"
      />
    </div>
  );
}

export { createFilter, type Filter };
