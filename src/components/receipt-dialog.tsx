
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { ReceiptData } from "@/lib/types";
import { ReceiptDisplay } from "./receipt-display";

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
}

export function ReceiptDialog({ isOpen, onClose, receiptData }: ReceiptDialogProps) {
  if (!receiptData) return null;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      // Temporarily hide non-receipt elements for printing
      const appRoot = document.body;
      const originalDisplayValues: { element: HTMLElement; display: string }[] = [];

      // Find all elements except the receipt itself and hide them
      appRoot.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            if (!el.classList.contains('receipt-dialog-content')) { // Check for a unique class on dialog content
                originalDisplayValues.push({ element: el, display: el.style.display });
                el.style.display = 'none';
            }
        }
      });
      
      // Ensure the dialog content itself is visible if it was nested
      const receiptDialogContent = document.querySelector('.receipt-dialog-content');
      if(receiptDialogContent) (receiptDialogContent as HTMLElement).style.display = 'block';


      window.print();

      // Restore original display values
       originalDisplayValues.forEach(({ element, display }) => {
        element.style.display = display;
      });
      if(receiptDialogContent) (receiptDialogContent as HTMLElement).style.display = ''; // Reset its display too
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl receipt-dialog-content print:shadow-none print:border-none print:m-0 print:p-0">
        <DialogHeader className="print:hidden">
          <DialogTitle className="font-headline">Payment Receipt</DialogTitle>
        </DialogHeader>
        
        <ReceiptDisplay receiptData={receiptData} />

        <DialogFooter className="print:hidden mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handlePrint} className="bg-primary hover:bg-primary/90">
            <Printer className="mr-2 h-4 w-4" /> Print Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
