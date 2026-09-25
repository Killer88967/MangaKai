"use client";

import { useState, useTransition } from "react";
import { USER_ROLES, type AdminUser, type UserRole } from "@mangakai/shared";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateUserRoleAction } from "./actions";

interface UsersTableProps {
  initialUsers: AdminUser[];
  currentUserId: string;
}

function formatJoined(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case "admin":
      return "border-brand/25 bg-brand-soft text-brand-hover";

    case "moderator":
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";

    case "creator":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    default:
      return "border-border bg-secondary text-muted-foreground";
  }
}

export function UsersTable({ initialUsers, currentUserId }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function changeRole(user: AdminUser, role: UserRole) {
    if (user.role === role) return;

    const previousRole = user.role;

    setPendingUserId(user.id);

    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? {
              ...item,
              role,
            }
          : item,
      ),
    );

    startTransition(async () => {
      const result = await updateUserRoleAction(user.id, role);

      if (!result.ok) {
        setUsers((current) =>
          current.map((item) =>
            item.id === user.id
              ? {
                  ...item,
                  role: previousRole,
                }
              : item,
          ),
        );

        toast.error(result.error ?? "Unable to update role.");
        setPendingUserId(null);

        return;
      }

      toast.success(`${user.displayName}'s role is now ${role}.`);
      setPendingUserId(null);
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4">User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const pending = isPending && pendingUserId === user.id;

            return (
              <TableRow key={user.id}>
                <TableCell className="px-4 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {user.displayName}
                      </p>

                      {isCurrentUser && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          You
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {user.id}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {user.email}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={roleBadgeClass(user.role)}
                    >
                      {user.role}
                    </Badge>

                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        changeRole(user, value as UserRole)
                      }
                      disabled={isCurrentUser || pending}
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-32"
                        aria-label={`Change ${user.displayName}'s role`}
                      >
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent align="start">
                        {USER_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            <span className="capitalize">{role}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {formatJoined(user.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
