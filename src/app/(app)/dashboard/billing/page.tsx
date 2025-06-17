
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BadgeDollarSign, Receipt, AlertTriangle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import type { Resident, Room, Payment } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

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

interface PaymentOverview {
  upcoming: number;
  overdue: number;
  collectedThisMonth: number;
  recentPayments: (Payment & { residentName: string; roomNumber: string })[];
  overdueResidents: (Resident & { roomDetails?: Room; overdueAmount: number; lastPaymentMonth?: string })[];
}

const pageLoadDate = new Date();
const staticMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function BillingPage() {
  const [paymentOverview, setPaymentOverview] = useState<PaymentOverview>({
    upcoming: 0,
    overdue: 0,
    collectedThisMonth: 0,
    recentPayments: [],
    overdueResidents: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentDisplayDate, setCurrentDisplayDate] = useState(pageLoadDate);


  const calculatePaymentOverview = useCallback(() => {
    setIsLoading(true);
    // Filter for active residents only for billing calculations
    const activeResidents = getStoredData<Resident>('pgResidents')
      .map(r => ({ ...r, status: r.status || 'active', payments: r.payments || [] }))
      .filter(r => r.status === 'active');
    const rooms = getStoredData<Room>('pgRooms');

    const currentDate = new Date(); 
    setCurrentDisplayDate(currentDate); 
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    let upcomingTotal = 0;
    let overdueTotal = 0;
    let collectedThisMonthTotal = 0;
    const allPayments: (Payment & { residentName: string; roomNumber: string })[] = [];
    const overdueResidentsList: (Resident & { roomDetails?: Room; overdueAmount: number; lastPaymentMonth?: string })[] = [];

    activeResidents.forEach(resident => {
      const room = rooms.find(r => r.id === resident.roomId);
      if (!room || room.rent <= 0) return;

      resident.payments.forEach(p => {
        allPayments.push({ ...p, residentName: resident.name, roomNumber: room.roomNumber });
      });
      
      const paymentThisMonth = resident.payments.find(p => p.month === currentMonth && p.year === currentYear && p.roomId === room.id);
      if (paymentThisMonth) {
        const totalPaidCurrentMonth = resident.payments
            .filter(p => p.month === currentMonth && p.year === currentYear && p.roomId === room.id)
            .reduce((sum, p) => sum + p.amount, 0);
        
        collectedThisMonthTotal += totalPaidCurrentMonth;
        if (totalPaidCurrentMonth < room.rent) {
            upcomingTotal += (room.rent - totalPaidCurrentMonth);
        }
      } else {
        upcomingTotal += room.rent;
      }

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
            firstCheckYear = currentYear;
            firstCheckMonth = 1;
        }

      } else {
        firstCheckYear = lastFullyPaidPeriod.month === 12 ? lastFullyPaidPeriod.year + 1 : lastFullyPaidPeriod.year;
        firstCheckMonth = lastFullyPaidPeriod.month === 12 ? 1 : lastFullyPaidPeriod.month + 1;
      }

      for (let y = firstCheckYear; y <= currentYear; y++) {
        const monthStart = (y === firstCheckYear) ? firstCheckMonth : 1;
        const monthEnd = (y < currentYear) ? 12 : currentMonth -1; 
        
        for (let m = monthStart; m <= monthEnd; m++) {
           if (y > currentYear || (y === currentYear && m >= currentMonth)) {
             continue; 
           }

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

    allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setPaymentOverview({
      upcoming: upcomingTotal,
      overdue: overdueTotal,
      collectedThisMonth: collectedThisMonthTotal,
      recentPayments: allPayments.slice(0, 5),
      overdueResidents: overdueResidentsList.sort((a,b) => b.overdueAmount - a.overdueAmount),
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    calculatePaymentOverview();
    const handleStorageChange = () => calculatePaymentOverview();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [calculatePaymentOverview]);


  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-headline font-semibold">Billing &amp; Payments Overview</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/billing/collected" className="block hover:shadow-lg transition-shadow rounded-lg">
          <Card className="shadow-md h-full cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collected (This Month)</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{paymentOverview.collectedThisMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total rent collected for {staticMonths[currentDisplayDate.getMonth()]} {currentDisplayDate.getFullYear()}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/billing/upcoming" className="block hover:shadow-lg transition-shadow rounded-lg">
          <Card className="shadow-md h-full cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Payments (Current Month)</CardTitle>
              <Receipt className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{paymentOverview.upcoming.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Expected from unpaid/partially paid active residents this month
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/billing/overdue" className="block hover:shadow-lg transition-shadow rounded-lg">
          <Card className="shadow-md h-full cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
               <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">₹{paymentOverview.overdue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total outstanding from active residents for previous periods
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Receipt className="mr-2 h-5 w-5 text-primary" />Recent Payments</CardTitle>
            <CardDescription>Last 5 recorded payment transactions (from active residents).</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentOverview.recentPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentOverview.recentPayments.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.residentName}</TableCell>
                      <TableCell>{p.roomNumber}</TableCell>
                      <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                      <TableCell>{format(new Date(p.date), 'dd MMM, yyyy')}</TableCell>
                      <TableCell><Badge variant="outline">{p.mode}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No recent payments recorded from active residents.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center text-destructive"><AlertTriangle className="mr-2 h-5 w-5" />Overdue Residents</CardTitle>
            <CardDescription>Active residents with outstanding payments from previous periods.</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentOverview.overdueResidents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Overdue Amt.</TableHead>
                    <TableHead>Last Fully Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentOverview.overdueResidents.map(r => (
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

      <Card className="shadow-lg mt-6">
        <CardHeader className="flex flex-row items-center space-x-2">
          <BadgeDollarSign className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline">Billing System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-2 p-6 border rounded-lg bg-secondary/30 flex flex-col items-center text-center">
            <Image src="https://placehold.co/300x200.png" alt="Billing illustration" width={300} height={200} className="rounded-md mb-4" data-ai-hint="invoice payment" />
            <h3 className="text-xl font-semibold mb-2">Automated Invoicing &amp; Reminders Coming Soon!</h3>
            <p className="text-muted-foreground max-w-md">
              We are working hard to bring you a more comprehensive billing system including automated invoice generation and payment reminders. Stay tuned for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
