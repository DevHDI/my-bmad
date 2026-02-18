"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import type { StoryDetail } from "@/lib/bmad/types";

function TaskGauge({ completed, total }: { completed: number; total: number }) {
  const size = 44;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = Math.PI * radius;
  const percent = total > 0 ? completed / total : 0;
  const filledLength = circumference * percent;
  const remainingLength = circumference - filledLength;
  const svgH = size / 2 + stroke / 2;

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <svg
        width={size}
        height={svgH}
        viewBox={`0 0 ${size} ${svgH}`}
      >
        {/* Background arc */}
        <path
          d={`M ${stroke / 2} ${svgH - 1} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${svgH - 1}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-muted-foreground/20"
        />
        {/* Filled arc */}
        {percent > 0 && (
          <path
            d={`M ${stroke / 2} ${svgH - 1} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${svgH - 1}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${filledLength} ${remainingLength}`}
            className={percent >= 1 ? "text-emerald-500" : "text-emerald-400"}
          />
        )}
      </svg>
      <span className="text-xs font-semibold tabular-nums text-muted-foreground">
        {completed}/{total}
      </span>
    </div>
  );
}

const columns: ColumnDef<StoryDetail>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        S{row.getValue("id")}
      </span>
    ),
    size: 80,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Title
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("title")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "epicTitle",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Epic
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.getValue("epicTitle") || "-"}
      </span>
    ),
  },
  {
    accessorKey: "totalTasks",
    header: "Tasks",
    cell: ({ row }) => {
      const story = row.original;
      if (story.totalTasks === 0) return <span className="text-muted-foreground">-</span>;
      return <TaskGauge completed={story.completedTasks} total={story.totalTasks} />;
    },
    size: 80,
  },
];

interface StoriesTableProps {
  stories: StoryDetail[];
}

export function StoriesTable({ stories }: StoriesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: stories,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize: 20 } },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No story found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
