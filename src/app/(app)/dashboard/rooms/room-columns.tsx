"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const getRoomColumns = (
  onEdit: (room: Room) => void,
  onDelete: (roomId: string) => void
): ColumnDef<Room>[] => [
  {
    accessorKey: "roomNumber",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Room No.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue("roomNumber")}</div>,
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
    cell: ({ row }) => <div>{row.getValue("capacity")} persons</div>,
  },
  {
    accessorKey: "currentOccupancy",
    header: "Occupancy",
    cell: ({ row }) => {
      const capacity = row.original.capacity;
      const occupancy = row.original.currentOccupancy;
      const occupancyRate = capacity > 0 ? (occupancy / capacity) * 100 : 0;
      let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
      if (occupancyRate < 50) badgeVariant = "secondary";
      if (occupancyRate >= 100) badgeVariant = "destructive";


      return (
        <div className="flex items-center space-x-2">
           <span>{occupancy} / {capacity}</span>
           <Badge variant={badgeVariant} className={occupancy === capacity ? "bg-destructive text-destructive-foreground" : "bg-green-500 text-white"}>
            {occupancy === capacity ? "Full" : `${Math.round(occupancyRate)}%`}
          </Badge>
        </div>
      );
    }
  },
  {
    accessorKey: "rent",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Rent (₹)
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("rent"));
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const room = row.original;
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
            <DropdownMenuItem onClick={() => onEdit(room)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(room.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
