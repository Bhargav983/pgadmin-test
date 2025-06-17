
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { DisplayAttendanceRecord, AttendanceStatus } from "./page"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
import { ArrowUpDown, Edit3 } from "lucide-react";

const getStatusBadgeVariant = (status: AttendanceStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Present': return 'secondary';
      case 'Late': return 'default'; 
      case 'Absent': return 'destructive';
      case 'On Leave': return 'outline';
      case 'Pending': return 'outline'; 
      default: return 'outline';
    }
  };

const getStatusBadgeStyle = (status: AttendanceStatus): React.CSSProperties => {
    switch (status) {
        case 'Present': return { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' };
        case 'Late': return { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'};
        case 'Absent': return { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))'};
        case 'On Leave': return { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' };
        case 'Pending': return { borderColor: 'hsl(var(--muted-foreground))', color: 'hsl(var(--muted-foreground))' };
        default: return {};
    }
};

export const getAttendanceColumns = (
  onOpenForm: (record: DisplayAttendanceRecord) => void
): ColumnDef<DisplayAttendanceRecord>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "residentName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Resident Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("residentName")}</div>,
  },
  {
    accessorKey: "roomNumber",
    header: "Room",
    cell: ({ row }) => row.getValue("roomNumber") || "N/A",
  },
  {
    accessorKey: "checkInTime",
    header: "Check-In",
    cell: ({ row }) => row.getValue("checkInTime") || "-",
  },
  {
    accessorKey: "checkOutTime",
    header: "Check-Out",
    cell: ({ row }) => row.getValue("checkOutTime") || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as AttendanceStatus;
      return <Badge style={getStatusBadgeStyle(status)} variant={getStatusBadgeVariant(status)}>{status}</Badge>;
    },
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notes = row.getValue("notes") as string | null;
      return notes ? <div className="truncate max-w-xs">{notes}</div> : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const record = row.original;
      return (
        <Button variant="outline" size="sm" onClick={() => onOpenForm(record)}>
          <Edit3 className="mr-2 h-4 w-4" /> Log/Update
        </Button>
      );
    },
  },
];
