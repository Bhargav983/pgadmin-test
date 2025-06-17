
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import type { Resident, Room, Payment } from "@/lib/types";
import { format } from 'date-fns';
import { CheckCircle2, ArrowLeft } from "lucide-react";

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

interface CollectedPayment extends Payment {
  residentName: string;
  roomNumber: string;
}

export default function CollectedPaymentsPage() {
  const [collectedPayments, setCollectedPayments] = useState<CollectedPayment[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState('');

  const fetchCollectedPayments = useCallback(() => {
    setIsLoading(true);
    const activeResidents = getStoredData<Resident>('pgResidents')
        .map(r => ({ ...r, status: r.status || 'active', payments: r.payments || [] }))
        .filter(r => r.status === 'active');
    const rooms = getStoredData<Room>('pgRooms');
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    setCurrentDisplayMonth(`${staticMonths[currentMonth-1]} ${currentYear}`);

    let currentMonthTotal = 0;
    const paymentsThisMonth: CollectedPayment[] = [];

    activeResidents.forEach(resident => {
      const room = rooms.find(r => r.id === resident.roomId);
      resident.payments.forEach(payment => {
        if (payment.month === currentMonth && payment.year === currentYear) {
          paymentsThisMonth.push({
            ...payment,
            residentName: resident.name,
            roomNumber: room?.roomNumber || 'N/A',
          });
          currentMonthTotal += payment.amount;
        }
      });
    });

    setCollectedPayments(paymentsThisMonth.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setTotalCollected(currentMonthTotal);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCollectedPayments();
    const handleStorageChange = () => fetchCollectedPayments();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchCollectedPayments]);

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
                <CheckCircle2 className="mr-3 h-8 w-8 text-green-500" />
                Collected Payments ({currentDisplayMonth})
            </h1>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Total Collected: <span className="text-green-500 font-bold">₹{totalCollected.toLocaleString()}</span></CardTitle>
          <CardDescription>All payments recorded for active residents for {currentDisplayMonth}.</CardDescription>
        </CardHeader>
        <CardContent>
          {collectedPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectedPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.receiptId || 'N/A'}</TableCell>
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
            <p className="text-muted-foreground">No payments collected from active residents for {currentDisplayMonth} yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
