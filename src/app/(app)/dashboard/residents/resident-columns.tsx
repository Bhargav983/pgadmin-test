
"use client";

import Link from "next/link";
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
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, CreditCard, Repeat, UserX, UserCheck, RotateCcw, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const getCurrentMonthPaymentStatus = (resident: Resident, rooms: Room[]): { status: string, variant: "default" | "secondary" | "destructive" | "outline", rentAmount: number | null } => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();

  const assignedRoom = rooms.find(room => room.id === resident.roomId);
  if (!assignedRoom || resident.status !== 'active') { 
    return { status: "N/A", variant: "outline", rentAmount: null };
  }

  const rentAmount = assignedRoom.rent;
  const totalPaidCurrentMonth = resident.payments
    .filter(p => p.month === currentMonth && p.year === currentYear && p.roomId === resident.roomId)
    .reduce((sum, p) => sum + p.amount, 0);

  if (totalPaidCurrentMonth >= rentAmount) {
    return { status: "Paid", variant: "secondary", rentAmount };
  }
  return { status: "Due", variant: "destructive", rentAmount };
};

const NameCell = ({ row }: { row: { original: Resident, getValue: (key: string) => any } }) => {
  const resident = row.original;
  return (
    <Button variant="link" className="p-0 h-auto font-medium" asChild>
      <Link href={`/dashboard/residents/${resident.id}`}>
        {row.getValue("name")}
      </Link>
    </Button>
  );
};


// --- Active Resident Columns ---
export const getActiveResidentColumns = (
  rooms: Room[],
  onEdit: (residentId: string) => void,
  onDelete: (residentId: string) => void,
  onRecordPayment: (resident: Resident) => void,
  onTransfer: (resident: Resident) => void,
  onVacate: (resident: Resident) => void,
): ColumnDef<Resident>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Name<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
    ),
    cell: NameCell,
  },
  { accessorKey: "contact", header: "Contact" },
  {
    accessorKey: "roomId",
    header: "Room No.",
    cell: ({ row }) => {
      const roomId = row.getValue("roomId") as string | null;
      const room = rooms.find(r => r.id === roomId);
      return room ? room.roomNumber : <Badge variant="outline">Unassigned</Badge>;
    },
  },
  {
    id: "currentMonthPaymentStatus",
    header: "Payment (Current Month)",
    cell: ({ row }) => {
      const resident = row.original;
      if (!resident.roomId) return <Badge variant="outline">N/A</Badge>;
      const { status, variant } = getCurrentMonthPaymentStatus(resident, rooms);
      let badgeStyle: React.CSSProperties = {};
      if (variant === "secondary") badgeStyle = { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' };
      if (variant === "destructive") badgeStyle = { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' };
      return <Badge style={badgeStyle} variant={status === "N/A" ? "outline" : undefined}>{status}</Badge>;
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
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={`/dashboard/residents/${resident.id}`} className="flex items-center w-full"><Eye className="mr-2 h-4 w-4" /> View Details</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(resident.id)}><Pencil className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRecordPayment(resident)} disabled={!resident.roomId}><CreditCard className="mr-2 h-4 w-4" /> Record Payment</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTransfer(resident)} disabled={!resident.roomId}><Repeat className="mr-2 h-4 w-4" /> Transfer Room</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onVacate(resident)} disabled={!resident.roomId} className="text-orange-600 focus:text-orange-700 focus:bg-orange-100"><UserX className="mr-2 h-4 w-4" /> Vacate Resident</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(resident.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Resident</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// --- Upcoming Resident Columns ---
export const getUpcomingResidentColumns = (
  rooms: Room[],
  onEdit: (residentId: string) => void,
  onDelete: (residentId: string) => void,
  onActivate: (resident: Resident) => void,
): ColumnDef<Resident>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Name<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
    ),
    cell: NameCell,
  },
  { accessorKey: "contact", header: "Contact" },
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
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={`/dashboard/residents/${resident.id}`} className="flex items-center w-full"><Eye className="mr-2 h-4 w-4" /> View Details</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={() => onActivate(resident)} className="text-green-600 focus:text-green-700 focus:bg-green-100"><UserCheck className="mr-2 h-4 w-4" /> Activate Resident</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(resident.id)}><Pencil className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(resident.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Record</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// --- Former Resident Columns ---
export const getFormerResidentColumns = (
  onEdit: (residentId: string) => void,
  onDelete: (residentId: string) => void,
  onReactivate: (resident: Resident) => void,
): ColumnDef<Resident>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Name<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
    ),
    cell: NameCell,
  },
  { accessorKey: "contact", header: "Contact" },
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
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild><Link href={`/dashboard/residents/${resident.id}`} className="flex items-center w-full"><Eye className="mr-2 h-4 w-4" /> View Details</Link></DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReactivate(resident)} className="text-blue-600 focus:text-blue-700 focus:bg-blue-100"><RotateCcw className="mr-2 h-4 w-4" /> Reactivate (to Upcoming)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(resident.id)}><Pencil className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(resident.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete Record</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
