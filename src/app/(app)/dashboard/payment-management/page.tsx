
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getPaymentManagementColumns } from "./payment-management-columns";
import type { Resident, Room, Payment, PaymentFormValues as PaymentDataInput, ReceiptData, ActivityLogEntry, ActivityType } from "@/lib/types";
import { PaymentForm } from "@/components/payment-form";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { IndianRupee } from 'lucide-react';

const getStoredData = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse localStorage data for key:", key, e);
    return [];
  }
};

const setStoredData = <T,>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(0, i), 'MMMM') }));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // Range of 10 years centered around current

export interface ProcessedPaymentEntry {
  residentId: string;
  name: string;
  roomNumber: string;
  currentMonthRent: number;
  previousBalance: number;
  totalDueSelectedPeriod: number;
  amountPaidSelectedMonth: number;
  remainingForSelectedMonth: number;
  dueDate: string;
  statusSelectedMonth: 'Paid' | 'Partially Paid' | 'Unpaid';
  paymentDateForMonth?: string;
  paymentModeForMonth?: string;
  resident: Resident; // Full resident object for actions
  room?: Room; // Full room object
}

export default function PaymentManagementPage() {
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [processedPayments, setProcessedPayments] = useState<ProcessedPaymentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedResidentForPayment, setSelectedResidentForPayment] = useState<Resident | null>(null);
  const [paymentFormDefaultMonth, setPaymentFormDefaultMonth] = useState<number | undefined>(undefined);
  const [paymentFormDefaultYear, setPaymentFormDefaultYear] = useState<number | undefined>(undefined);
  
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState<ReceiptData | null>(null);

  const { toast } = useToast();

  // Derived summary states
  const [totalRentForSelectedPeriod, setTotalRentForSelectedPeriod] = useState(0);
  const [totalPaidForSelectedPeriod, setTotalPaidForSelectedPeriod] = useState(0);
  const [totalPreviousBalanceSum, setTotalPreviousBalanceSum] = useState(0);
  const [overallTotalDue, setOverallTotalDue] = useState(0);
  
  const fetchDataAndProcess = useCallback(() => {
    setIsLoading(true);
    const storedResidents = getStoredData<Resident>('pgResidents').map(r => ({
      ...r,
      status: r.status || 'active',
      payments: r.payments || [],
      activityLog: r.activityLog || [],
    }));
    const activeResidents = storedResidents.filter(r => r.status === 'active');
    setAllResidents(storedResidents); 

    const storedRooms = getStoredData<Room>('pgRooms');
    setRooms(storedRooms);

    const dataForTable: ProcessedPaymentEntry[] = activeResidents.map(resident => {
      const room = storedRooms.find(r => r.id === resident.roomId);
      const currentMonthRent = room ? room.rent : 0;

      let previousBalance = 0;
      if (room && room.rent > 0) {
        for (let y = (resident.joiningDate ? new Date(resident.joiningDate).getFullYear() : filterYear -1) ; y <= filterYear; y++) {
          const monthStart = (y === (resident.joiningDate ? new Date(resident.joiningDate).getFullYear() : filterYear -1)) ? (resident.joiningDate ? new Date(resident.joiningDate).getMonth() + 1 : 1) : 1;
          const monthEnd = (y < filterYear) ? 12 : filterMonth - 1;

          for (let m = monthStart; m <= monthEnd; m++) {
            if (y > filterYear || (y === filterYear && m >= filterMonth)) continue;
            
            const rentForPastMonth = room.rent; 
            const paymentsForPastMonth = resident.payments.filter(p => p.month === m && p.year === y && p.roomId === room.id);
            const amountPaidPastMonth = paymentsForPastMonth.reduce((sum, p) => sum + p.amount, 0);

            if (amountPaidPastMonth < rentForPastMonth) {
              previousBalance += (rentForPastMonth - amountPaidPastMonth);
            }
          }
        }
      }
      
      const paymentsSelectedMonth = resident.payments.filter(p => p.month === filterMonth && p.year === filterYear && p.roomId === room?.id);
      const amountPaidSelectedMonth = paymentsSelectedMonth.reduce((sum, p) => sum + p.amount, 0);
      
      let statusSelectedMonth: ProcessedPaymentEntry['statusSelectedMonth'] = 'Unpaid';
      if (amountPaidSelectedMonth >= currentMonthRent && currentMonthRent > 0) {
        statusSelectedMonth = 'Paid';
      } else if (amountPaidSelectedMonth > 0) {
        statusSelectedMonth = 'Partially Paid';
      }

      return {
        residentId: resident.id,
        name: resident.name,
        roomNumber: room?.roomNumber || 'N/A',
        currentMonthRent: currentMonthRent,
        previousBalance: previousBalance,
        totalDueSelectedPeriod: currentMonthRent + previousBalance,
        amountPaidSelectedMonth: amountPaidSelectedMonth,
        remainingForSelectedMonth: Math.max(0, currentMonthRent - amountPaidSelectedMonth),
        dueDate: `5th ${format(new Date(filterYear, filterMonth - 1), 'MMMM yyyy')}`,
        statusSelectedMonth: statusSelectedMonth,
        paymentDateForMonth: paymentsSelectedMonth.length > 0 ? format(new Date(paymentsSelectedMonth[paymentsSelectedMonth.length - 1].date), 'dd MMM, yyyy') : undefined,
        paymentModeForMonth: paymentsSelectedMonth.length > 0 ? paymentsSelectedMonth[paymentsSelectedMonth.length -1].mode : undefined,
        resident: resident,
        room: room,
      };
    });

    setProcessedPayments(dataForTable.sort((a,b) => a.name.localeCompare(b.name)));
    setIsLoading(false);
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchDataAndProcess();
    const handleStorageChange = () => fetchDataAndProcess(); // For cross-tab updates
    window.addEventListener('storage', handleStorageChange);
    
    const handleDataChangedEvent = (event: Event) => { // For same-tab updates
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.storeKey === 'pgResidents') {
            fetchDataAndProcess();
        }
    };
    window.addEventListener('dataChanged', handleDataChangedEvent);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('dataChanged', handleDataChangedEvent);
    };
  }, [fetchDataAndProcess]);

  useEffect(() => {
    // Calculate summary totals whenever processedPayments changes
    const rentSum = processedPayments.reduce((acc, curr) => acc + curr.currentMonthRent, 0);
    const paidSum = processedPayments.reduce((acc, curr) => acc + curr.amountPaidSelectedMonth, 0);
    const prevBalSum = processedPayments.reduce((acc, curr) => acc + curr.previousBalance, 0);
    
    setTotalRentForSelectedPeriod(rentSum);
    setTotalPaidForSelectedPeriod(paidSum);
    setTotalPreviousBalanceSum(prevBalSum);
    setOverallTotalDue(rentSum + prevBalSum);
  }, [processedPayments]);

  const handleOpenPaymentForm = (data: ProcessedPaymentEntry) => {
    setSelectedResidentForPayment(data.resident);
    setPaymentFormDefaultMonth(filterMonth);
    setPaymentFormDefaultYear(filterYear);
    setIsPaymentFormOpen(true);
  };

  const handleSavePayment = async (paymentInput: PaymentDataInput) => {
    if (!selectedResidentForPayment || !selectedResidentForPayment.roomId) {
      toast({ title: "Error", description: "No resident or room selected for payment.", variant: "destructive" });
      return;
    }
    const roomForPayment = rooms.find(r => r.id === selectedResidentForPayment.roomId);
    if (!roomForPayment) {
        toast({ title: "Error", description: "Could not find room details for payment.", variant: "destructive" });
        return;
    }

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      receiptId: `RCPT-${crypto.randomUUID().substring(0,8).toUpperCase()}`,
      roomId: selectedResidentForPayment.roomId,
       ...paymentInput,
    };
    
    const paymentDescription = `Payment of ₹${newPayment.amount.toLocaleString()} via ${newPayment.mode} for ${format(new Date(newPayment.year, newPayment.month - 1), 'MMMM yyyy')} recorded. Room: ${roomForPayment.roomNumber}.`;
    const newLogEntry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: 'PAYMENT_RECORDED',
      description: paymentDescription,
      details: { paymentId: newPayment.id, amount: newPayment.amount, roomNumber: roomForPayment.roomNumber },
    };

    const updatedResidentsList = allResidents.map(res => {
      if (res.id === selectedResidentForPayment.id) {
        return { 
          ...res, 
          payments: [...(res.payments || []), newPayment],
          activityLog: [...(res.activityLog || []), newLogEntry]
        };
      }
      return res;
    });
    
    setAllResidents(updatedResidentsList); // Update local state
    setStoredData('pgResidents', updatedResidentsList); // Update localStorage with final data

    // Dispatch custom event to notify other components (like Reports page)
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dataChanged', { detail: { storeKey: 'pgResidents' } }));
    }
    
    fetchDataAndProcess(); // Refresh current page's table (reads from updated localStorage)
    
    setIsPaymentFormOpen(false);
    setCurrentReceiptData({ payment: newPayment, residentName: selectedResidentForPayment.name, roomNumber: roomForPayment.roomNumber, pgName: "PG Admin"});
    setIsReceiptDialogOpen(true);
    toast({ title: "Payment Recorded", description: `Payment for ${selectedResidentForPayment.name} recorded.`, variant: "default" });
    setSelectedResidentForPayment(null);
  };


  const columns = getPaymentManagementColumns(handleOpenPaymentForm);
  
  const selectedPeriodFormatted = format(new Date(filterYear, filterMonth - 1), 'MMM yyyy');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-headline font-semibold flex items-center">
        <IndianRupee className="mr-3 h-8 w-8 text-primary" /> Payment Management
      </h1>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Filters & Summary for {selectedPeriodFormatted}</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 items-end">
            <div>
              <label htmlFor="month-filter" className="text-sm font-medium">Month</label>
              <Select value={filterMonth.toString()} onValueChange={(value) => setFilterMonth(parseInt(value))}>
                <SelectTrigger id="month-filter">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="year-filter" className="text-sm font-medium">Year</label>
              <Select value={filterYear.toString()} onValueChange={(value) => setFilterYear(parseInt(value))}>
                <SelectTrigger id="year-filter">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 bg-secondary rounded-md">
                <p className="text-xs text-muted-foreground">Rent for {selectedPeriodFormatted}</p>
                <p className="text-lg font-bold">₹{totalRentForSelectedPeriod.toLocaleString()}</p>
            </div>
             <div className="p-4 bg-secondary rounded-md">
                <p className="text-xs text-muted-foreground">Paid for {selectedPeriodFormatted}</p>
                <p className="text-lg font-bold text-green-600">₹{totalPaidForSelectedPeriod.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-secondary rounded-md">
                <p className="text-xs text-muted-foreground">Total Prev. Balance</p>
                <p className="text-lg font-bold text-destructive">₹{totalPreviousBalanceSum.toLocaleString()}</p>
            </div>
             <div className="p-4 bg-secondary rounded-md">
                <p className="text-xs text-muted-foreground">Overall Due (inc. Prev)</p>
                <p className="text-lg font-bold">₹{overallTotalDue.toLocaleString()}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          ) : processedPayments.length > 0 ? (
            <DataTable columns={columns} data={processedPayments} filterColumn="name" filterInputPlaceholder="Filter by resident name..."/>
          ) : (
            <p className="text-muted-foreground text-center py-8">No active residents found or no data for the selected period.</p>
          )}
        </CardContent>
      </Card>

      {selectedResidentForPayment && (
        <PaymentForm 
            isOpen={isPaymentFormOpen} 
            onClose={() => { setIsPaymentFormOpen(false); setSelectedResidentForPayment(null); }}
            onSubmit={handleSavePayment} 
            residentName={selectedResidentForPayment.name} 
            defaultRentAmount={rooms.find(r => r.id === selectedResidentForPayment.roomId)?.rent || 0}
            defaultMonth={paymentFormDefaultMonth}
            defaultYear={paymentFormDefaultYear}
        />
      )}
      {currentReceiptData && (<ReceiptDialog isOpen={isReceiptDialogOpen} onClose={() => setIsReceiptDialogOpen(false)} receiptData={currentReceiptData} /> )}
    </div>
  );
}
