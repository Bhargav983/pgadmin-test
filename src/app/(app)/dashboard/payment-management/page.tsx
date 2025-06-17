
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getPaymentManagementColumns } from "./payment-management-columns";
import type { Resident, Room, Payment, PaymentFormValues as PaymentDataInput, ReceiptData, ActivityLogEntry, ActivityType } from "@/lib/types";
import { PaymentForm } from "@/components/payment-form";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  currentMonthRent: number; // This will now be effective rent (rent - discount)
  originalRoomRent: number; // Store original room rent for reference
  discountApplied: number; // Store discount amount applied
  previousBalance: number;
  totalDueSelectedPeriod: number;
  amountPaidSelectedMonth: number;
  remainingForSelectedMonth: number;
  dueDate: string;
  statusSelectedMonth: 'Paid' | 'Partially Paid' | 'Unpaid';
  paymentDateForMonth?: string;
  paymentModeForMonth?: string;
  resident: Resident; 
  room?: Room; 
  isFullyPaidForSelectedPeriod: boolean;
}

type PaymentStatusTab = "all" | "unpaid" | "partiallyPaid" | "paid";

export default function PaymentManagementPage() {
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [processedPayments, setProcessedPayments] = useState<ProcessedPaymentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<PaymentStatusTab>("all");

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedResidentForPayment, setSelectedResidentForPayment] = useState<Resident | null>(null);
  const [paymentFormDefaultMonth, setPaymentFormDefaultMonth] = useState<number | undefined>(undefined);
  const [paymentFormDefaultYear, setPaymentFormDefaultYear] = useState<number | undefined>(undefined);
  const [paymentFormDefaultRentAmount, setPaymentFormDefaultRentAmount] = useState<number>(0);
  
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState<ReceiptData | null>(null);

  const { toast } = useToast();

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
      monthlyDiscountAmount: r.monthlyDiscountAmount || 0,
    }));
    const activeResidents = storedResidents.filter(r => r.status === 'active');
    setAllResidents(storedResidents); 

    const storedRooms = getStoredData<Room>('pgRooms');
    setRooms(storedRooms);

    const dataForTable: ProcessedPaymentEntry[] = activeResidents.map(resident => {
      const room = storedRooms.find(r => r.id === resident.roomId);
      const originalRoomRent = room ? room.rent : 0;
      const discountAmount = resident.monthlyDiscountAmount || 0;
      const effectiveMonthlyRent = Math.max(0, originalRoomRent - discountAmount);

      let previousBalance = 0;
      if (room && originalRoomRent > 0) { // Calculate prev balance based on original room rent structure
        const residentJoiningYear = resident.joiningDate ? new Date(resident.joiningDate).getFullYear() : filterYear -1;
        const residentJoiningMonth = resident.joiningDate ? new Date(resident.joiningDate).getMonth() + 1 : 1;

        for (let y = residentJoiningYear; y <= filterYear; y++) {
          const monthStart = (y === residentJoiningYear) ? residentJoiningMonth : 1;
          const monthEnd = (y < filterYear) ? 12 : filterMonth - 1;

          for (let m = monthStart; m <= monthEnd; m++) {
            if (y > filterYear || (y === filterYear && m >= filterMonth)) continue;
            
            // Find historical room and discount for past period if complex logic is needed
            // For simplicity, we assume current room's rent and current discount for past dues calc
            // This could be made more accurate if room/discount history was tracked per resident.
            const rentForPastMonth = Math.max(0, originalRoomRent - (resident.monthlyDiscountAmount || 0));
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
      const isFullyPaidForSelectedPeriod = amountPaidSelectedMonth >= effectiveMonthlyRent && effectiveMonthlyRent > 0;

      if (isFullyPaidForSelectedPeriod) {
        statusSelectedMonth = 'Paid';
      } else if (amountPaidSelectedMonth > 0) {
        statusSelectedMonth = 'Partially Paid';
      }

      return {
        residentId: resident.id,
        name: resident.name,
        roomNumber: room?.roomNumber || 'N/A',
        currentMonthRent: effectiveMonthlyRent,
        originalRoomRent: originalRoomRent,
        discountApplied: discountAmount,
        previousBalance: previousBalance,
        totalDueSelectedPeriod: effectiveMonthlyRent + previousBalance,
        amountPaidSelectedMonth: amountPaidSelectedMonth,
        remainingForSelectedMonth: Math.max(0, effectiveMonthlyRent - amountPaidSelectedMonth),
        dueDate: `5th ${format(new Date(filterYear, filterMonth - 1), 'MMMM yyyy')}`,
        statusSelectedMonth: statusSelectedMonth,
        paymentDateForMonth: paymentsSelectedMonth.length > 0 ? format(new Date(paymentsSelectedMonth[paymentsSelectedMonth.length - 1].date), 'dd MMM, yyyy') : undefined,
        paymentModeForMonth: paymentsSelectedMonth.length > 0 ? paymentsSelectedMonth[paymentsSelectedMonth.length -1].mode : undefined,
        resident: resident,
        room: room,
        isFullyPaidForSelectedPeriod: isFullyPaidForSelectedPeriod,
      };
    });

    setProcessedPayments(dataForTable.sort((a,b) => a.name.localeCompare(b.name)));
    setIsLoading(false);
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchDataAndProcess();
    const handleStorageChange = () => fetchDataAndProcess();
    window.addEventListener('storage', handleStorageChange);
    
    const handleDataChangedEvent = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.storeKey === 'pgResidents' || customEvent.detail?.storeKey === 'pgRooms') {
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
    // Sum of effective rents for the period
    const rentSum = processedPayments.reduce((acc, curr) => acc + curr.currentMonthRent, 0);
    const paidSum = processedPayments.reduce((acc, curr) => acc + curr.amountPaidSelectedMonth, 0);
    const prevBalSum = processedPayments.reduce((acc, curr) => acc + curr.previousBalance, 0);
    
    setTotalRentForSelectedPeriod(rentSum);
    setTotalPaidForSelectedPeriod(paidSum);
    setTotalPreviousBalanceSum(prevBalSum);
    setOverallTotalDue(rentSum + prevBalSum); // Overall due includes current effective rent + previous balance
  }, [processedPayments]);


  const filteredPaymentsForTable = useMemo(() => {
    if (activeTab === 'all') return processedPayments;
    return processedPayments.filter(p => {
      if (activeTab === 'unpaid') return p.statusSelectedMonth === 'Unpaid' && p.currentMonthRent > 0;
      if (activeTab === 'partiallyPaid') return p.statusSelectedMonth === 'Partially Paid';
      if (activeTab === 'paid') return p.statusSelectedMonth === 'Paid';
      return true;
    });
  }, [processedPayments, activeTab]);

  const paymentStatusCounts = useMemo(() => {
    return {
      all: processedPayments.length,
      unpaid: processedPayments.filter(p => p.statusSelectedMonth === 'Unpaid' && p.currentMonthRent > 0).length,
      partiallyPaid: processedPayments.filter(p => p.statusSelectedMonth === 'Partially Paid').length,
      paid: processedPayments.filter(p => p.statusSelectedMonth === 'Paid').length,
    };
  }, [processedPayments]);


  const handleOpenPaymentForm = (data: ProcessedPaymentEntry) => {
    const selectedPeriodFormattedUser = format(new Date(filterYear, filterMonth - 1), 'MMMM yyyy');
    if (data.isFullyPaidForSelectedPeriod && data.previousBalance <= 0) {
      toast({
        title: "Payment Settled",
        description: `Payment for ${data.name} for ${selectedPeriodFormattedUser} is already settled, and there are no previous dues. For adjustments or other periods, use the resident's detail page.`,
        variant: "default", 
      });
      return;
    }
    setSelectedResidentForPayment(data.resident);
    setPaymentFormDefaultMonth(filterMonth);
    setPaymentFormDefaultYear(filterYear);
    setPaymentFormDefaultRentAmount(data.currentMonthRent > data.amountPaidSelectedMonth ? data.currentMonthRent - data.amountPaidSelectedMonth : data.previousBalance > 0 ? data.previousBalance : data.currentMonthRent);
    setIsPaymentFormOpen(true);
  };

  const handleSavePayment = async (paymentInput: PaymentDataInput) => {
    if (!selectedResidentForPayment || !selectedResidentForPayment.roomId) {
      toast({ title: "Error", description: "No resident or room selected for payment.", variant: "destructive" });
      return;
    }
    
    const residentData = allResidents.find(r => r.id === selectedResidentForPayment.id);
    if (!residentData) {
        toast({ title: "Error", description: "Could not find resident data.", variant: "destructive" });
        return;
    }

    const roomForPayment = rooms.find(r => r.id === residentData.roomId);
    if (!roomForPayment || roomForPayment.rent <= 0) { // Check original rent
        toast({ title: "Error", description: "Resident is not assigned to a valid room with rent or rent is zero.", variant: "destructive" });
        return;
    }

    const targetMonth = paymentInput.month;
    const targetYear = paymentInput.year;
    const discount = residentData.monthlyDiscountAmount || 0;
    const effectiveRoomRent = Math.max(0, roomForPayment.rent - discount);


    const amountAlreadyPaidForTargetPeriod = residentData.payments
      .filter(p => p.month === targetMonth && p.year === targetYear && p.roomId === roomForPayment.id)
      .reduce((sum, p) => sum + p.amount, 0);

    let actualPreviousBalance = 0;
    const residentJoiningYear = residentData.joiningDate ? new Date(residentData.joiningDate).getFullYear() : targetYear -1;
    const residentJoiningMonth = residentData.joiningDate ? new Date(residentData.joiningDate).getMonth() + 1 : 1;

    for (let y = residentJoiningYear; y <= targetYear; y++) {
      const monthStart = (y === residentJoiningYear) ? residentJoiningMonth : 1;
      const monthEnd = (y < targetYear) ? 12 : targetMonth - 1;
      for (let m = monthStart; m <= monthEnd; m++) {
        if (y > targetYear || (y === targetYear && m >= targetMonth)) continue;
        // For historical balance, assume current room & discount for simplicity. 
        // More complex: track historical room assignments & discounts.
        const historicalEffectiveRent = Math.max(0, roomForPayment.rent - (residentData.monthlyDiscountAmount || 0));
        const paymentsForPastMonth = residentData.payments.filter(p => p.month === m && p.year === y && p.roomId === roomForPayment.id);
        const amountPaidPastMonth = paymentsForPastMonth.reduce((acc, curr) => acc + curr.amount, 0);
        if (amountPaidPastMonth < historicalEffectiveRent) {
          actualPreviousBalance += (historicalEffectiveRent - amountPaidPastMonth);
        }
      }
    }
    
    const isTargetPeriodFullyCoveredByExistingPayments = (amountAlreadyPaidForTargetPeriod >= effectiveRoomRent);
    const canProceedWithPayment = !isTargetPeriodFullyCoveredByExistingPayments || actualPreviousBalance > 0;

    if (!canProceedWithPayment && effectiveRoomRent > 0) {
      toast({
        title: "Payment Not Allowed",
        description: `Payment for ${format(new Date(targetYear, targetMonth -1), 'MMMM yyyy')} is already settled for ${residentData.name}, and there are no previous dues.`,
        variant: "destructive",
      });
      return;
    }
     if (!canProceedWithPayment && effectiveRoomRent <= 0) { // If effective rent is 0 (full discount) and no prev balance
        toast({
            title: "No Payment Needed",
            description: `The effective rent for ${residentData.name} for ${format(new Date(targetYear, targetMonth -1), 'MMMM yyyy')} is ₹0 due to discount, and there are no previous dues.`,
            variant: "default",
        });
        return;
    }

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      receiptId: `RCPT-${crypto.randomUUID().substring(0,8).toUpperCase()}`,
      roomId: residentData.roomId,
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
      if (res.id === residentData.id) {
        return { 
          ...res, 
          payments: [...(res.payments || []), newPayment],
          activityLog: [...(res.activityLog || []), newLogEntry]
        };
      }
      return res;
    });
    
    setStoredData('pgResidents', updatedResidentsList);
    setAllResidents(updatedResidentsList); 
    
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dataChanged', { detail: { storeKey: 'pgResidents' } }));
    }
    
    fetchDataAndProcess(); 
    
    setIsPaymentFormOpen(false);
    setCurrentReceiptData({ payment: newPayment, residentName: residentData.name, roomNumber: roomForPayment.roomNumber, pgName: "PG Admin"});
    setIsReceiptDialogOpen(true);
    toast({ title: "Payment Recorded", description: `Payment for ${residentData.name} recorded.`, variant: "default" });
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
                <p className="text-xs text-muted-foreground">Net Rent for {selectedPeriodFormatted}</p>
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PaymentStatusTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
              <TabsTrigger value="all">All ({paymentStatusCounts.all})</TabsTrigger>
              <TabsTrigger value="unpaid">Unpaid ({paymentStatusCounts.unpaid})</TabsTrigger>
              <TabsTrigger value="partiallyPaid">Partially Paid ({paymentStatusCounts.partiallyPaid})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({paymentStatusCounts.paid})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
                {isLoading ? (
                <div className="flex h-64 items-center justify-center"><div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>
                ) : filteredPaymentsForTable.length > 0 ? (
                <DataTable columns={columns} data={filteredPaymentsForTable} filterColumn="name" filterInputPlaceholder="Filter by resident name..."/>
                ) : (
                <p className="text-muted-foreground text-center py-8">No active residents found or no data for the selected period/status.</p>
                )}
            </TabsContent>
             <TabsContent value="unpaid">
                {isLoading ? (
                <div className="flex h-64 items-center justify-center"><div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>
                ) : filteredPaymentsForTable.length > 0 ? (
                <DataTable columns={columns} data={filteredPaymentsForTable} filterColumn="name" filterInputPlaceholder="Filter by resident name..."/>
                ) : (
                <p className="text-muted-foreground text-center py-8">No unpaid records for the selected period/status.</p>
                )}
            </TabsContent>
             <TabsContent value="partiallyPaid">
                {isLoading ? (
                <div className="flex h-64 items-center justify-center"><div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>
                ) : filteredPaymentsForTable.length > 0 ? (
                <DataTable columns={columns} data={filteredPaymentsForTable} filterColumn="name" filterInputPlaceholder="Filter by resident name..."/>
                ) : (
                <p className="text-muted-foreground text-center py-8">No partially paid records for the selected period/status.</p>
                )}
            </TabsContent>
             <TabsContent value="paid">
                {isLoading ? (
                <div className="flex h-64 items-center justify-center"><div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div></div>
                ) : filteredPaymentsForTable.length > 0 ? (
                <DataTable columns={columns} data={filteredPaymentsForTable} filterColumn="name" filterInputPlaceholder="Filter by resident name..."/>
                ) : (
                <p className="text-muted-foreground text-center py-8">No paid records for the selected period/status.</p>
                )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedResidentForPayment && (
        <PaymentForm 
            isOpen={isPaymentFormOpen} 
            onClose={() => { setIsPaymentFormOpen(false); setSelectedResidentForPayment(null); }}
            onSubmit={handleSavePayment} 
            residentName={selectedResidentForPayment.name} 
            defaultRentAmount={paymentFormDefaultRentAmount}
            defaultMonth={paymentFormDefaultMonth}
            defaultYear={paymentFormDefaultYear}
        />
      )}
      {currentReceiptData && (<ReceiptDialog isOpen={isReceiptDialogOpen} onClose={() => setIsReceiptDialogOpen(false)} receiptData={currentReceiptData} /> )}
    </div>
  );
}
