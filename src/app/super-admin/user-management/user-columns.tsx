
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ManagedUser, ManagedUserStatus, ManagedUserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const getStatusBadgeStyle = (status: ManagedUserStatus): React.CSSProperties => {
    switch (status) {
        case 'active': return { backgroundColor: 'hsl(var(--chart-2))', color: 'hsl(var(--primary-foreground))' }; // Greenish
        case 'inactive': return { borderColor: 'hsl(var(--muted-foreground))', color: 'hsl(var(--muted-foreground))' };
        default: return {};
    }
};

export const getManagedUserColumns = (
  onEdit: (user: ManagedUser) => void,
  onDelete: (userId: string) => void,
  onToggleStatus: (userId: string, currentStatus: ManagedUserStatus) => void
): ColumnDef<ManagedUser>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as ManagedUserRole;
      return <Badge variant="outline">{role}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as ManagedUserStatus;
      return <Badge style={getStatusBadgeStyle(status)} variant={status === 'active' ? "secondary" : "outline"}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(user.id, user.status)}>
              {user.status === 'active' ? <ToggleLeft className="mr-2 h-4 w-4 text-orange-500" /> : <ToggleRight className="mr-2 h-4 w-4 text-green-500" />}
              {user.status === 'active' ? 'Set Inactive' : 'Set Active'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(user.id)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
              <Trash2 className="mr-2 h-4 w-4" /> Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
