
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Enquiry, EnquiryStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle, Send, Clock } from "lucide-react";
import { format, isValid } from "date-fns";
import { enquiryStatuses } from "@/lib/types";

const getStatusBadgeStyle = (status: EnquiryStatus): React.CSSProperties => {
    switch (status) {
        case 'New': return { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }; // Blue-ish
        case 'Follow-up': return { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }; // Purple-ish
        case 'Converted': return { backgroundColor: 'hsl(var(--chart-2))', color: 'hsl(var(--primary-foreground))' }; // Green-ish
        case 'Closed': return { borderColor: 'hsl(var(--muted-foreground))', color: 'hsl(var(--muted-foreground))' };
        default: return {};
    }
};

const getStatusBadgeVariant = (status: EnquiryStatus): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'New': return 'default';
    case 'Follow-up': return 'default';
    case 'Converted': return 'secondary';
    case 'Closed': return 'outline';
    default: return 'outline';
  }
};

export const getEnquiryColumns = (
  onEdit: (enquiry: Enquiry) => void,
  onUpdateStatus: (enquiryId: string, newStatus: EnquiryStatus) => void,
  onDelete: (enquiryId: string) => void
): ColumnDef<Enquiry>[] => [
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
    accessorKey: "contact",
    header: "Contact",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.getValue("email") || "-",
  },
  {
    accessorKey: "enquiryDate",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Enquiry Date <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
        const dateVal = row.getValue("enquiryDate");
        return dateVal && typeof dateVal === 'string' && isValid(new Date(dateVal)) 
               ? format(new Date(dateVal), "dd MMM, yyyy") 
               : "Invalid Date";
    }
  },
  {
    accessorKey: "nextFollowUpDate",
    header: "Next Follow-up",
    cell: ({ row }) => {
        const dateVal = row.getValue("nextFollowUpDate");
        return dateVal && typeof dateVal === 'string' && isValid(new Date(dateVal)) 
               ? format(new Date(dateVal), "dd MMM, yyyy") 
               : "-";
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as EnquiryStatus;
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
      const enquiry = row.original;
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
            <DropdownMenuItem onClick={() => onEdit(enquiry)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit Details
            </DropdownMenuItem>
            <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                    <Send className="mr-2 h-4 w-4" /> Update Status
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                        {enquiryStatuses.map(status => (
                            <DropdownMenuItem 
                                key={status} 
                                onClick={() => onUpdateStatus(enquiry.id, status)}
                                disabled={enquiry.status === status}
                            >
                                {enquiry.status === status ? <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> : <Clock className="mr-2 h-4 w-4"/> }
                                Mark as {status}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(enquiry.id)} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Enquiry
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
