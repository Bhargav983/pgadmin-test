
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { DisplayComplaint, ComplaintStatus, Complaint } from "@/lib/types";
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
import { ArrowUpDown, MoreHorizontal, Pencil, CheckCircle, RotateCcw, XCircle, Settings2, Trash2 } from "lucide-react"; // Added Trash2
import { format } from "date-fns";

const getStatusBadgeVariant = (status: ComplaintStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'Open': return 'destructive';
    case 'In Progress': return 'default'; // Using accent color
    case 'Resolved': return 'secondary'; // Using primary color
    case 'Closed': return 'outline';
    default: return 'outline';
  }
};

const getStatusBadgeStyle = (status: ComplaintStatus): React.CSSProperties => {
    switch (status) {
        case 'Open': return { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' };
        case 'In Progress': return { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))'};
        case 'Resolved': return { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))'};
        case 'Closed': return { borderColor: 'hsl(var(--muted-foreground))', color: 'hsl(var(--muted-foreground))' };
        default: return {};
    }
};

export const getComplaintColumns = (
  onEdit: (complaint: Complaint) => void,
  onUpdateStatus: (complaintId: string, newStatus: ComplaintStatus) => void,
  onDelete: (complaintId: string) => void
): ColumnDef<DisplayComplaint>[] => [
  {
    accessorKey: "dateReported",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Reported <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => format(new Date(row.getValue("dateReported")), "dd MMM, yyyy"),
  },
  {
    accessorKey: "residentName",
    header: "Resident",
    cell: ({ row }) => <div className="font-medium">{row.getValue("residentName")}</div>,
  },
  {
    accessorKey: "roomNumber",
    header: "Room",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => <div className="truncate max-w-xs">{row.getValue("description")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as ComplaintStatus;
      return <Badge style={getStatusBadgeStyle(status)} variant={getStatusBadgeVariant(status)}>{status}</Badge>;
    },
  },
  {
    accessorKey: "dateResolved",
    header: "Resolved On",
    cell: ({ row }) => row.getValue("dateResolved") ? format(new Date(row.getValue("dateResolved")), "dd MMM, yyyy") : "-",
  },
  {
    accessorKey: "resolutionNotes",
    header: "Resolution",
    cell: ({ row }) => {
        const notes = row.getValue("resolutionNotes") as string | null;
        return notes ? <div className="truncate max-w-xs">{notes}</div> : "-";
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const complaint = row.original;
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
            <DropdownMenuItem onClick={() => onEdit(complaint)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {complaint.status === 'Open' && (
              <DropdownMenuItem onClick={() => onUpdateStatus(complaint.id, 'In Progress')}>
                <Settings2 className="mr-2 h-4 w-4" /> Mark In Progress
              </DropdownMenuItem>
            )}
            {(complaint.status === 'Open' || complaint.status === 'In Progress') && (
              <DropdownMenuItem onClick={() => onEdit(complaint)}>
                 {/* Direct to edit for resolution notes */}
                <CheckCircle className="mr-2 h-4 w-4" /> Mark Resolved
              </DropdownMenuItem>
            )}
            {complaint.status === 'Resolved' && (
              <DropdownMenuItem onClick={() => onUpdateStatus(complaint.id, 'Closed')}>
                <XCircle className="mr-2 h-4 w-4" /> Close Ticket
              </DropdownMenuItem>
            )}
             {complaint.status === 'Closed' && (
              <DropdownMenuItem onClick={() => onUpdateStatus(complaint.id, 'Open')}>
                <RotateCcw className="mr-2 h-4 w-4" /> Re-Open
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(complaint.id)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Complaint
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
