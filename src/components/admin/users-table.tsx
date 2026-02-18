"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type SortKey = "name" | "email" | "role" | "createdAt";
type SortDirection = "asc" | "desc";

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = users.filter(
      (u) =>
        (u.name?.toLowerCase().includes(q) ?? false) ||
        u.email.toLowerCase().includes(q)
    );

    return filtered.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "name":
          return (a.name ?? "").localeCompare(b.name ?? "") * dir;
        case "email":
          return a.email.localeCompare(b.email) * dir;
        case "role":
          return a.role.localeCompare(b.role) * dir;
        case "createdAt":
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            dir
          );
      }
    });
  }, [users, search, sortKey, sortDir]);

  const ariaSort = (key: SortKey) =>
    sortKey === key
      ? sortDir === "asc"
        ? ("ascending" as const)
        : ("descending" as const)
      : ("none" as const);

  const sortLabel = (column: string, key: SortKey) => {
    const direction = sortKey === key ? (sortDir === "asc" ? "descending" : "ascending") : "ascending";
    return `Sort by ${column} ${direction}`;
  };

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead aria-sort={ariaSort("name")}>
                <button
                  type="button"
                  aria-label={sortLabel("User", "name")}
                  className="inline-flex items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => toggleSort("name")}
                >
                  User
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead aria-sort={ariaSort("email")}>
                <button
                  type="button"
                  aria-label={sortLabel("Email", "email")}
                  className="inline-flex items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => toggleSort("email")}
                >
                  Email
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead aria-sort={ariaSort("role")}>
                <button
                  type="button"
                  aria-label={sortLabel("Role", "role")}
                  className="inline-flex items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => toggleSort("role")}
                >
                  Role
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
              <TableHead className="text-center">Repos</TableHead>
              <TableHead aria-sort={ariaSort("createdAt")}>
                <button
                  type="button"
                  aria-label={sortLabel("Joined", "createdAt")}
                  className="inline-flex items-center gap-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => toggleSort("createdAt")}
                >
                  Joined
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No user found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <RoleManager
                      userId={user.id}
                      currentRole={user.role}
                      currentUserId={currentUserId}
                      userName={user.name}
                    />
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {user._count.repos}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
