"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import {
  DataGrid,
  DataGridContainer,
} from "@/components/reui/data-grid/data-grid";
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table";
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { RoleManager } from "@/components/admin/role-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";
import type { AdminUser } from "@/actions/admin-actions";

interface UsersTableProps {
  users: AdminUser[];
  currentUserId: string;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function makeColumns(currentUserId: string): ColumnDef<AdminUser>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              {user.image && (
                <AvatarImage src={user.image} alt={user.name ?? user.email} />
              )}
              <AvatarFallback>
                {getInitials(user.name, user.email[0]?.toUpperCase() ?? "?")}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {user.name ?? "Unnamed"}
            </span>
          </div>
        );
      },
      filterFn: (row, _columnId, filterValue: string) => {
        const q = filterValue.toLowerCase();
        const user = row.original;
        return (
          (user.name?.toLowerCase().includes(q) ?? false) ||
          user.email.toLowerCase().includes(q)
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("email")}</span>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <RoleManager
            userId={user.id}
            currentRole={user.role}
            currentUserId={currentUserId}
            userName={user.name}
          />
        );
      },
    },
    {
      accessorKey: "_count.repos",
      header: "Repos",
      cell: ({ row }) => (
        <span className="text-center text-muted-foreground">
          {row.original._count.repos}
        </span>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataGridColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      sortingFn: "datetime",
    },
  ];
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);

  const columns = useMemo(() => makeColumns(currentUserId), [currentUserId]);

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      columnFilters: search
        ? [{ id: "name", value: search }]
        : [],
    },
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Users</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              aria-label="Search for a user"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataGrid
          table={table}
          recordCount={users.length}
          tableLayout={{
            headerBackground: true,
            headerBorder: true,
            rowBorder: true,
          }}
        >
          <DataGridContainer border={false}>
            <DataGridTable />
          </DataGridContainer>
        </DataGrid>
      </CardContent>
    </Card>
  );
}
