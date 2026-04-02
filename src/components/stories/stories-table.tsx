"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { StatusBadge } from "@/components/shared/status-badge";
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
        <path
          d={`M ${stroke / 2} ${svgH - 1} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${svgH - 1}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className="text-muted-foreground/20"
        />
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
    enableSorting: false,
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("title")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "epicTitle",
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Epic" />
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
    enableSorting: false,
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
    <DataGrid
      table={table}
      recordCount={stories.length}
      tableLayout={{
        headerSticky: true,
        headerBackground: true,
        headerBorder: true,
        rowBorder: true,
      }}
    >
      <DataGridContainer>
        <DataGridTable />
      </DataGridContainer>
      {table.getPageCount() > 1 && (
        <DataGridPagination
          sizes={[10, 20, 50]}
          info="{from} - {to} of {count}"
        />
      )}
    </DataGrid>
  );
}
