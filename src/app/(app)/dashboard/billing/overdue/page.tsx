
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Resident, Room } from "@/lib/types";
import { AlertTriangle, ArrowLeft } from "lucide-react";

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

const staticMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface OverdueResident extends Resident {
  roomDetails?: Room;
  overdueAmount: number;
  lastPaymentMonth?: string;
}

export default function OverduePaymentsPage() {
  const [overdueResidents, setOverdueResidents] = useState<OverdueResident[]>([]);
  const [totalOverdueAmount, setTotalOverdueAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOverduePayments = useCallback(() => {
    setIsLoading(true);
    const activeResidents = getStoredData<Resident>('pgResidents')
        .map(r => ({ ...r, status: r.status || 'active', payments: r.payments || [] }))
        .filter(r => r.status === 'active');
    const rooms = getStoredData<Room>('pgRooms');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    let overdueTotal = 0;
    const overdueResidentsList: OverdueResident[] = [];

    activeResidents.forEach(resident => {
      const room = rooms.find(r => r.id === resident.roomId);
      if (!room || room.rent <= 0) return;

      let totalDueFromResident = 0;
      let lastFullyPaidPeriod = { year: 0, month: 0 };

      resident.payments
        .filter(p => p.roomId === room.id)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .forEach(p => {
          const paymentsForItsPeriod = resident.payments.filter(pm => pm.month === p.month && pm.year === p.year && pm.roomId === room.id);
          const totalPaidForItsPeriod = paymentsForItsPeriod.reduce((sum, payment) => sum + payment.amount, 0);
          if (totalPaidForItsPeriod >= room.rent) {
             if (p.year > lastFullyPaidPeriod.year || (p.year === lastFullyPaidPeriod.year && p.month > lastFullyPaidPeriod.month)) {
                lastFullyPaidPeriod = { year: p.year, month: p.month };
             }
          }
        });
      
      let firstCheckYear, firstCheckMonth;
      if (lastFullyPaidPeriod.year === 0) {
        const earliestPayment = resident.payments.length > 0 ? 
            resident.payments.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
            : null;
        if (earliestPayment) {
            firstCheckYear = earliestPayment.year;
            firstCheckMonth = earliestPayment.month;
        } else {
            // If no payments, check from start of current year or a sensible default
            firstCheckYear = currentYear; // Or perhaps resident.joinDate if available
            firstCheckMonth = 1;
        }
      } else {
        firstCheckYear = lastFullyPaidPeriod.month === 12 ? lastFullyPaidPeriod.year + 1 : lastFullyPaidPeriod.year;
        firstCheckMonth = lastFullyPaidPeriod.month === 12 ? 1 : lastFullyPaidPeriod.month + 1;
      }

      for (let y = firstCheckYear; y <= currentYear; y++) {
        const monthStart = (y === firstCheckYear) ? firstCheckMonth : 1;
        const monthEnd = (y < currentYear) ? 12 : currentMonth -1; // Only up to previous month
        for (let m = monthStart; m <= monthEnd; m++) {
           if (y > currentYear || (y === currentYear && m >= currentMonth)) continue;
           const paymentsForThisSpecificMonth = resident.payments.filter(p => p.month === m && p.year === y && p.roomId === room.id);
           const amountPaidThisMonth = paymentsForThisSpecificMonth.reduce((acc, curr) => acc + curr.amount, 0);
           if (amountPaidThisMonth < room.rent) {
               totalDueFromResident += (room.rent - amountPaidThisMonth);
           }
        }
      }

      if (totalDueFromResident > 0) {
        overdueTotal += totalDueFromResident;
        overdueResidentsList.push({ 
          ...resident, 
          roomDetails: room, 
          overdueAmount: totalDueFromResident,
          lastPaymentMonth: lastFullyPaidPeriod.month > 0 ? `${staticMonths[lastFullyPaidPeriod.month-1]} ${lastFullyPaidPeriod.year}` : 'Never Fully Paid'
        });
      }
    });
    
    setOverdueResidents(overdueResidentsList.sort((a,b) => b.overdueAmount - a.overdueAmount));
    setTotalOverdueAmount(overdueTotal);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchOverduePayments();
    const handleStorageChange = () => fetchOverduePayments();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchOverduePayments]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div className="flex items-center space-x-3">
            <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard/billing">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Billing Overview</span>
                </Link>
            </Button>
            <h1 className="text-3xl font-headline font-semibold flex items-center">
                <AlertTriangle className="mr-3 h-8 w-8 text-destructive" />
                Overdue Payments
            </h1>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Total Overdue: <span className="text-destructive font-bold">₹{totalOverdueAmount.toLocaleString()}</span></CardTitle>
          <CardDescription>Active residents with outstanding payments from previous billing periods.</CardDescription>
        </CardHeader>
        <CardContent>
          {overdueResidents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Room No.</TableHead>
                  <TableHead>Total Overdue Amt.</TableHead>
                  <TableHead>Last Fully Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueResidents.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.roomDetails?.roomNumber || 'N/A'}</TableCell>
                    <TableCell className="text-destructive font-semibold">₹{r.overdueAmount.toLocaleString()}</TableCell>
                    <TableCell>{r.lastPaymentMonth}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No active residents with overdue payments currently.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
