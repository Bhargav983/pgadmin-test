"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Resident, Room, Payment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getCurrentMonthPaymentStatus = (resident: Resident, rooms: Room[]): { status: string, variant: "default" | "secondary" | "destructive" | "outline", rentAmount: number | null } => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  const assignedRoom = rooms.find(room => room.id === resident.roomId);
  if (!assignedRoom) {
    return { status: "No Room", variant: "outline", rentAmount: null };
  }

  const rentAmount = assignedRoom.rent;

  const paymentForCurrentMonth = resident.payments.find(
    (p) => p.month === currentMonth && p.year === currentYear && p.roomId === resident.roomId
  );

  if (paymentForCurrentMonth && paymentForCurrentMonth.amount >= rentAmount) {
    return { status: "Paid", variant: "secondary", rentAmount }; // Using 'secondary' for green-like
  }
  return { status: "Due", variant: "destructive", rentAmount }; // 'destructive' for red-like
};


export const getResidentColumns = (
  rooms: Room[],
  onEdit: (resident: Resident) => void,
  onDelete: (residentId: string) => void,
  onRecordPayment: (resident: Resident) => void,
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
    header: "Room No.",
    cell: ({ row }) => {
      const roomId = row.getValue("roomId") as string | null;
      const room = rooms.find(r => r.id === roomId);
      return room ? room.roomNumber : <span className="text-muted-foreground">Not Assigned</span>;
    },
  },
  {
    id: "currentMonthPaymentStatus",
    header: "Payment (Current Month)",
    cell: ({ row }) => {
      const resident = row.original;
      const { status, variant } = getCurrentMonthPaymentStatus(resident, rooms);
      
      let badgeStyle: React.CSSProperties = {};
      if (variant === "secondary") badgeStyle = { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }; // Greenish for Paid
      if (variant === "destructive") badgeStyle = { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' }; // Reddish for Due

      return <Badge style={badgeStyle} variant={status === "No Room" ? "outline" : undefined}>{status}</Badge>;
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
            <DropdownMenuItem onClick={() => onEdit(resident)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Resident
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRecordPayment(resident)} disabled={!resident.roomId}>
              <CreditCard className="mr-2 h-4 w-4" /> Record Payment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(resident.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Resident
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
