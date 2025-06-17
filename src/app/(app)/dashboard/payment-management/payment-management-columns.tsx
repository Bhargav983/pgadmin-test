
"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { ProcessedPaymentEntry } from "./page"; 
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, CreditCard, Eye } from "lucide-react";

export const getPaymentManagementColumns = (
  onRecordPayment: (data: ProcessedPaymentEntry) => void,
): ColumnDef<ProcessedPaymentEntry>[] => [
  {
    accessorKey: "residentId",
    header: "Res. ID",
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("residentId").substring(0,8)}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Name<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "roomNumber",
    header: "Room",
  },
  {
    accessorKey: "currentMonthRent",
    header: "Month Rent (₹)",
    cell: ({ row }) => `₹${row.original.currentMonthRent.toLocaleString()}`,
  },
  {
    accessorKey: "previousBalance",
    header: "Prev. Bal (₹)",
    cell: ({ row }) => <span className={row.original.previousBalance > 0 ? "text-destructive font-semibold" : ""}>₹{row.original.previousBalance.toLocaleString()}</span>,
  },
  {
    accessorKey: "totalDueSelectedPeriod",
    header: "Total Due (₹)",
    cell: ({ row }) => <span className="font-bold">₹{row.original.totalDueSelectedPeriod.toLocaleString()}</span>,
  },
  {
    accessorKey: "amountPaidSelectedMonth",
    header: "Paid (Month) (₹)",
    cell: ({ row }) => <span className="text-green-600">₹{row.original.amountPaidSelectedMonth.toLocaleString()}</span>,
  },
  {
    accessorKey: "remainingForSelectedMonth",
    header: "Bal. (Month) (₹)",
    cell: ({ row }) => {
        const remaining = row.original.remainingForSelectedMonth;
        return <span className={remaining > 0 ? "text-blue-600 font-semibold" : ""}>₹{remaining.toLocaleString()}</span>
    }
  },
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => row.original.dueDate,
  },
  {
    accessorKey: "statusSelectedMonth",
    header: "Status (Month)",
    cell: ({ row }) => {
      const status = row.original.statusSelectedMonth;
      let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (status === "Paid") badgeVariant = "secondary"; 
      if (status === "Unpaid") badgeVariant = "destructive";
      if (status === "Partially Paid") badgeVariant = "default"; 

      let badgeStyle: React.CSSProperties = {};
      if (status === "Paid") badgeStyle = { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }; 
      if (status === "Unpaid" && row.original.currentMonthRent > 0) badgeStyle = { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' };
      if (status === "Partially Paid") badgeStyle = { backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' };


      return <Badge style={badgeStyle} variant={badgeVariant === "outline" ? "outline" : undefined}>{row.original.currentMonthRent === 0 ? "N/A" : status}</Badge>;
    },
  },
  {
    accessorKey: "paymentDateForMonth",
    header: "Payment Date",
    cell: ({ row }) => row.original.paymentDateForMonth || "-",
  },
  {
    accessorKey: "paymentModeForMonth",
    header: "Method",
    cell: ({ row }) => row.original.paymentModeForMonth ? <Badge variant="outline">{row.original.paymentModeForMonth}</Badge> : "-",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const data = row.original;
      // Disable if room doesn't exist, rent is zero, OR if the month is fully paid AND no previous balance
      const canRecordPaymentForThisPeriod = data.room && data.currentMonthRent > 0 && 
                                           (!data.isFullyPaidForSelectedPeriod || data.previousBalance > 0);
      return (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/residents/${data.residentId}`}><Eye className="h-4 w-4" /></Link>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onRecordPayment(data)} 
            disabled={!canRecordPaymentForThisPeriod}
            className="bg-accent hover:bg-accent/80 text-accent-foreground"
          >
            <CreditCard className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
