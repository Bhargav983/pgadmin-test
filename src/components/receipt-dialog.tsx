
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Mail } from "lucide-react";
import type { ReceiptData } from "@/lib/types";
import { ReceiptDisplay } from "./receipt-display";
import { format } from 'date-fns';

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

// Simple WhatsApp SVG Icon
const WhatsAppIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    <path d="M19.07 4.93A10 10 0 1 1 4.93 19.07c2.32-2.02 3.49-4.49 3.49-7.07S7.25 6.95 4.93 4.93z" />
  </svg>
);


export function ReceiptDialog({ isOpen, onClose, receiptData }: ReceiptDialogProps) {
  if (!receiptData) return null;

  const { payment, residentName, pgName = "PG Admin" } = receiptData;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      const appRoot = document.body;
      const originalDisplayValues: { element: HTMLElement; display: string }[] = [];
      appRoot.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (!el.classList.contains('receipt-dialog-content')) {
                originalDisplayValues.push({ element: el, display: el.style.display });
                el.style.display = 'none';
            }
        }
      });
      const receiptDialogContent = document.querySelector('.receipt-dialog-content');
      if(receiptDialogContent) (receiptDialogContent as HTMLElement).style.display = 'block';
      window.print();
      originalDisplayValues.forEach(({ element, display }) => {
        element.style.display = display;
      });
      if(receiptDialogContent) (receiptDialogContent as HTMLElement).style.display = '';
    }
  };

  const getSharableText = () => {
    return `
Payment Receipt - ${pgName}
-----------------------------------
Resident: ${residentName}
Room: ${receiptData.roomNumber}
Receipt ID: ${payment.receiptId || 'N/A'}
Amount: ₹${payment.amount.toLocaleString()}
Payment For: ${format(new Date(payment.year, payment.month - 1), 'MMMM yyyy')}
Payment Date: ${format(new Date(payment.date), 'dd MMM, yyyy')}
Payment Mode: ${payment.mode}
${payment.notes ? `Notes: ${payment.notes}` : ''}
-----------------------------------
Thank you!
    `.trim();
  };

  const mailToHref = () => {
    const subject = `Payment Receipt - ${pgName} - ${residentName}`;
    const body = `Dear ${residentName},\n\nThank you for your payment.\n\nHere are your receipt details:\n\n${getSharableText()}\n\nRegards,\n${pgName}`;
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const whatsAppHref = () => {
    const text = `Hello ${residentName},\n\nHere is your payment receipt details from ${pgName}:\n\n${getSharableText()}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl receipt-dialog-content print:shadow-none print:border-none print:m-0 print:p-0">
        <DialogHeader className="print:hidden">
          <DialogTitle className="font-headline">Payment Receipt</DialogTitle>
        </DialogHeader>
        
        <ReceiptDisplay receiptData={receiptData} />

        <DialogFooter className="print:hidden mt-4 justify-between sm:justify-end sm:space-x-2">
          <Button type="button" variant="outline" onClick={onClose} className="sm:flex-grow-0">
            Close
          </Button>
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <Button type="button" variant="outline" onClick={() => window.open(mailToHref(), '_blank')} className="flex-1 sm:flex-grow-0">
              <Mail className="mr-2 h-4 w-4" /> Email
            </Button>
            <Button type="button" variant="outline" onClick={() => window.open(whatsAppHref(), '_blank')} className="flex-1 sm:flex-grow-0">
              <WhatsAppIcon /> <span className="ml-2">WhatsApp</span>
            </Button>
            <Button type="button" onClick={handlePrint} className="bg-primary hover:bg-primary/90 flex-1 sm:flex-grow-0">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
