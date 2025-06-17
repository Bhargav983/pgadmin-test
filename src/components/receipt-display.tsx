
"use client";

import React from "react";
import type { ReceiptData } from "@/lib/types";
import { format } from 'date-fns';
import { Separator } from "@/components/ui/separator";

interface ReceiptDisplayProps {
  receiptData: ReceiptData;
}

export function ReceiptDisplay({ receiptData }: ReceiptDisplayProps) {
  const { payment, residentName, roomNumber, pgName = "PG Admin" } = receiptData;
  const issueDate = new Date();

  return (
    <div className="p-6 bg-card text-card-foreground rounded-lg border border-border print:border-none print:shadow-none print:rounded-none">
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt-dialog-content {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .print\:hidden { display: none !important; }
          .print\:block { display: block !important; }
          .print\:text-sm { font-size: 0.875rem !important; }
          .print\:p-0 { padding: 0 !important; }
          .print\:m-0 { margin: 0 !important; }
          .print\:border-none { border: none !important; }
          .print\:shadow-none { box-shadow: none !important; }
        }
      `}</style>
      <header className="text-center mb-6">
        <h1 className="text-2xl font-headline font-bold text-primary">{pgName}</h1>
        <p className="text-muted-foreground text-sm">Payment Receipt</p>
      </header>

      <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6 text-sm">
        <div>
          <p className="font-semibold">Receipt No:</p>
          <p>{payment.receiptId || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Date of Issue:</p>
          <p>{format(issueDate, 'dd MMM, yyyy')}</p>
        </div>
        <div>
          <p className="font-semibold">Received From:</p>
          <p>{residentName}</p>
        </div>
        <div>
          <p className="font-semibold">Room No:</p>
          <p>{roomNumber}</p>
        </div>
      </div>

      <Separator className="my-4" />

      <h2 className="text-lg font-semibold mb-3">Payment Details</h2>
      <div className="space-y-2 text-sm mb-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment For:</span>
          <span className="font-medium">{format(new Date(payment.year, payment.month - 1), 'MMMM yyyy')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount Paid:</span>
          <span className="font-bold text-lg text-primary">₹{payment.amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment Date:</span>
          <span className="font-medium">{format(new Date(payment.date), 'dd MMM, yyyy')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Payment Mode:</span>
          <span className="font-medium">{payment.mode}</span>
        </div>
        {payment.notes && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Notes:</span>
            <span className="font-medium text-right max-w-[70%] break-words">{payment.notes}</span>
          </div>
        )}
      </div>
      
      <Separator className="my-4" />

      <footer className="mt-8 text-sm">
        <div className="flex justify-between items-end">
            <p className="text-muted-foreground">This is a system-generated receipt.</p>
            <div className="text-center">
                <div className="w-32 h-12 border-b border-dashed border-gray-400 mb-1"></div>
                <p className="text-xs text-muted-foreground">(Authorized Signature / Stamp)</p>
            </div>
        </div>
      </footer>
    </div>
  );
}
