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
import { useRouter, usePathname } from "next/navigation";
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { StatusBadge, SeverityBadge } from "@/components/shared/status-badge";
import type { Defect } from "@/lib/bmad/types";

const columns: ColumnDef<Defect>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.getValue("id")}
      </span>
    ),
    size: 100,
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
    accessorKey: "severity",
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Severity" />
    ),
    cell: ({ row }) => <SeverityBadge severity={row.getValue("severity")} />,
    size: 120,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    size: 140,
  },
  {
    accessorKey: "storyId",
    header: ({ column }) => (
      <DataGridColumnHeader column={column} title="Story" />
    ),
    cell: ({ row }) => {
      const storyId = row.getValue("storyId") as string;
      return storyId ? (
        <span className="font-mono text-xs text-muted-foreground">S{storyId}</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    size: 100,
  },
];

interface DefectsTableProps {
  defects: Defect[];
}

export function DefectsTable({ defects }: DefectsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();
  const pathname = usePathname();

  const table = useReactTable({
    data: defects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize: 20 } },
  });

  const handleRowClick = (defect: Defect) => {
    router.push(`${pathname}/${encodeURIComponent(defect.id)}`);
  };

  return (
    <DataGrid
      table={table}
      recordCount={defects.length}
      tableLayout={{
        headerSticky: true,
        headerBackground: true,
        headerBorder: true,
        rowBorder: true,
      }}
      onRowClick={handleRowClick}
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
