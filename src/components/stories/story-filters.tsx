"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { Epic } from "@/lib/bmad/types";

interface StoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  epicFilter: string;
  onEpicFilterChange: (value: string) => void;
  epics: Epic[];
}

export function StoryFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  epicFilter,
  onEpicFilterChange,
  epics,
}: StoryFiltersProps) {
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
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="done">Done</SelectItem>
          <SelectItem value="in-progress">In Progress</SelectItem>
          <SelectItem value="review">In Review</SelectItem>
          <SelectItem value="blocked">Blocked</SelectItem>
          <SelectItem value="ready-for-dev">Ready for Dev</SelectItem>
          <SelectItem value="backlog">Backlog</SelectItem>
        </SelectContent>
      </Select>
      <Select value={epicFilter} onValueChange={onEpicFilterChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All epics" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All epics</SelectItem>
          {epics.map((epic) => (
            <SelectItem key={epic.id} value={epic.id}>
              Epic {epic.id}: {epic.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
