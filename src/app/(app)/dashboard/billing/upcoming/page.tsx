
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Resident, Room } from "@/lib/types";
import { Receipt, ArrowLeft } from "lucide-react";

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

interface UpcomingPaymentResident extends Resident {
  roomDetails: Room | undefined;
  amountPaidThisMonth: number;
  amountDueThisMonth: number;
}

export default function UpcomingPaymentsPage() {
  const [upcomingResidents, setUpcomingResidents] = useState<UpcomingPaymentResident[]>([]);
  const [totalUpcomingAmount, setTotalUpcomingAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState('');

  const fetchUpcomingPayments = useCallback(() => {
    setIsLoading(true);
    const activeResidents = getStoredData<Resident>('pgResidents')
        .map(r => ({ ...r, status: r.status || 'active', payments: r.payments || [] }))
        .filter(r => r.status === 'active');
    const rooms = getStoredData<Room>('pgRooms');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    setCurrentDisplayMonth(`${staticMonths[currentMonth-1]} ${currentYear}`);

    let upcomingTotal = 0;
    const residentsWithUpcoming: UpcomingPaymentResident[] = [];

    activeResidents.forEach(resident => {
      const room = rooms.find(r => r.id === resident.roomId);
      if (!room || room.rent <= 0) return;

      const totalPaidCurrentMonth = resident.payments
        .filter(p => p.month === currentMonth && p.year === currentYear && p.roomId === room.id)
        .reduce((sum, p) => sum + p.amount, 0);
      
      if (totalPaidCurrentMonth < room.rent) {
        const amountDue = room.rent - totalPaidCurrentMonth;
        upcomingTotal += amountDue;
        residentsWithUpcoming.push({
          ...resident,
          roomDetails: room,
          amountPaidThisMonth: totalPaidCurrentMonth,
          amountDueThisMonth: amountDue,
        });
      }
    });

    setUpcomingResidents(residentsWithUpcoming.sort((a,b) => b.amountDueThisMonth - a.amountDueThisMonth));
    setTotalUpcomingAmount(upcomingTotal);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUpcomingPayments();
    const handleStorageChange = () => fetchUpcomingPayments();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUpcomingPayments]);

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
                <Receipt className="mr-3 h-8 w-8 text-blue-500" />
                Upcoming Payments ({currentDisplayMonth})
            </h1>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Total Upcoming: <span className="text-blue-500 font-bold">₹{totalUpcomingAmount.toLocaleString()}</span></CardTitle>
          <CardDescription>Active residents with pending (full or partial) payments for {currentDisplayMonth}.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingResidents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Room No.</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Amount Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingResidents.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.roomDetails?.roomNumber || 'N/A'}</TableCell>
                    <TableCell>₹{r.roomDetails?.rent.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell>₹{r.amountPaidThisMonth.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold text-blue-600">₹{r.amountDueThisMonth.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">All payments from active residents for {currentDisplayMonth} seem to be settled.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
