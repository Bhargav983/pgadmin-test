
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Resident, Room } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const getProspectiveResidentColumns = (
  rooms: Room[],
  onEdit: (resident: Resident) => void,
  onDelete: (residentId: string) => void,
  onActivate: (resident: Resident) => void,
): ColumnDef<Resident>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "contact",
    header: "Contact",
  },
  {
    accessorKey: "roomId",
    header: "Assigned Room",
    cell: ({ row }) => {
      const roomId = row.getValue("roomId") as string | null;
      const room = rooms.find(r => r.id === roomId);
      return room ? room.roomNumber : <Badge variant="outline">Unassigned</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={status === "upcoming" ? "secondary" : "default" } className={status === "upcoming" ? "bg-blue-500 text-white" : ""}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    },
  },
  {
    accessorKey: "personalInfo",
    header: "Additional Info",
    cell: ({ row }) => {
        const info = row.getValue("personalInfo") as string | undefined;
        return info ? <div className="truncate max-w-xs">{info}</div> : <span className="text-muted-foreground">N/A</span>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const resident = row.original;
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
            <DropdownMenuItem onClick={() => onActivate(resident)} className="text-green-600 focus:text-green-700 focus:bg-green-100">
              <UserCheck className="mr-2 h-4 w-4" /> Activate Resident
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(resident)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(resident.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Record
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
