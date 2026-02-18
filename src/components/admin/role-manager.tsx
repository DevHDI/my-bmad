"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUserRole } from "@/actions/admin-actions";

interface RoleManagerProps {
  userId: string;
  currentRole: string;
  currentUserId: string;
  userName?: string | null;
}

export function RoleManager({
  userId,
  currentRole,
  currentUserId,
  userName,
}: RoleManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isSelf = userId === currentUserId;

  function handleRoleChange(newRole: "user" | "admin") {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRole({ userId, newRole });
      if (!result.success) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={currentRole}
        onValueChange={handleRoleChange}
        disabled={isSelf || isPending}
      >
        <SelectTrigger
          className="w-28"
          aria-label={`Change role for ${userName ?? "user"}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">user</SelectItem>
          <SelectItem value="admin">admin</SelectItem>
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
