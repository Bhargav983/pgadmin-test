
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Receipt, AlertTriangle, CheckCircle2, Users, BedDouble, ClipboardCheck, FileDown, IndianRupee } from "lucide-react";
import type { Resident, Room, Payment, AttendanceRecord } from "@/lib/types"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, startOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface ReportSummaries {
  // Payment related
  upcomingPaymentsAmount: number;
  overduePaymentsAmount: number;
  collectedThisMonthAmount: number;
  recentPayments: (Payment & { residentName: string; roomNumber: string })[];
  overdueResidents: (Resident & { roomDetails?: Room; overdueAmount: number; lastPaymentMonth?: string })[]; 
  // Attendance related
  presentToday: number;
  lateToday: number;
  absentToday: number;
  onLeaveToday: number;
  pendingToday: number;
  // Occupancy related
  totalActiveResidents: number;
  totalCapacity: number;
  occupiedBeds: number;
  vacantBeds: number;
}

const pageLoadDate = new Date();
const staticMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportsOverviewPage() {
  const [reportSummaries, setReportSummaries] = useState<ReportSummaries>({
    upcomingPaymentsAmount: 0,
    overduePaymentsAmount: 0,
    collectedThisMonthAmount: 0,
    recentPayments: [],
    overdueResidents: [],
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    pendingToday: 0,
    totalActiveResidents: 0,
    totalCapacity: 0,
    occupiedBeds: 0,
    vacantBeds: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentDisplayDate, setCurrentDisplayDate] = useState(pageLoadDate);
  const [isClient, setIsClient] = useState(false);


  const calculateReportSummaries = useCallback(() => {
    setIsLoading(true);
    const activeResidents = getStoredData<Resident>('pgResidents')
      .map(r => ({ ...r, status: r.status || 'active', payments: r.payments || [] }))
      .filter(r => r.status === 'active');
    const rooms = getStoredData<Room>('pgRooms');
    const allAttendanceRecords = getStoredData<AttendanceRecord>('pgAttendanceRecords');

    const currentDate = new Date();
    setCurrentDisplayDate(currentDate);
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const todayFormatted = format(startOfDay(currentDate), 'yyyy-MM-dd');

    // --- Payment Calculations ---
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

    // --- Attendance Calculations ---
    let presentToday = 0, lateToday = 0, absentToday = 0, onLeaveToday = 0, pendingToday = 0;
    const attendanceForToday = allAttendanceRecords.filter(ar => ar.date === todayFormatted);
    const activeResidentIds = new Set(activeResidents.map(res => res.id));

    attendanceForToday.forEach(ar => {
      if (!activeResidentIds.has(ar.residentId)) return; 
      switch(ar.status) {
        case 'Present': presentToday++; break;
        case 'Late': lateToday++; break;
        case 'Absent': absentToday++; break;
        case 'On Leave': onLeaveToday++; break;
        // 'Pending' status is counted below for those with no record
      }
    });
    // Add residents who have no attendance record for today to 'Pending'
    pendingToday = activeResidents.filter(res => !attendanceForToday.find(ar => ar.residentId === res.id)).length;


    // --- Occupancy Calculations ---
    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const totalActiveResidents = activeResidents.length; 
    const vacantBeds = totalCapacity - totalActiveResidents;

    setReportSummaries({
      upcomingPaymentsAmount: upcomingTotal,
      overduePaymentsAmount: overdueTotal,
      collectedThisMonthAmount: collectedThisMonthTotal,
      recentPayments: allPayments.slice(0, 5),
      overdueResidents: overdueResidentsList.sort((a,b) => b.overdueAmount - a.overdueAmount),
      presentToday,
      lateToday,
      absentToday,
      onLeaveToday,
      pendingToday,
      totalActiveResidents,
      totalCapacity,
      occupiedBeds: totalActiveResidents,
      vacantBeds: vacantBeds < 0 ? 0 : vacantBeds, 
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setIsClient(true); 
    calculateReportSummaries();

    const handleDataChanged = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.storeKey === 'pgResidents' || customEvent.detail?.storeKey === 'pgRooms' || customEvent.detail?.storeKey === 'pgAttendanceRecords') {
        calculateReportSummaries();
      }
    };
    
    const handleStorageChange = () => { 
        calculateReportSummaries();
    }

    window.addEventListener('dataChanged', handleDataChanged);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('dataChanged', handleDataChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [calculateReportSummaries]);


  if (isLoading && !isClient) { // Show loader only on initial server render or if client is still loading
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-headline font-semibold">Reports Overview</h1>
        <p className="text-sm text-muted-foreground">As of: {format(currentDisplayDate, 'PPP p')}</p>
      </div>

      <Tabs defaultValue="financial" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
          <TabsTrigger value="financial"><IndianRupee className="mr-2 h-4 w-4" />Financial</TabsTrigger>
          <TabsTrigger value="attendance"><ClipboardCheck className="mr-2 h-4 w-4" />Attendance</TabsTrigger>
          <TabsTrigger value="occupancy"><BedDouble className="mr-2 h-4 w-4" />Occupancy</TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="mt-6">
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-semibold text-primary">Financial Summary</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/dashboard/billing/collected" className="block hover:shadow-lg transition-shadow rounded-lg">
                <Card className="shadow-md h-full cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Collected (This Month)</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{reportSummaries.collectedThisMonthAmount.toLocaleString()}</div>
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
                    <div className="text-2xl font-bold">₹{reportSummaries.upcomingPaymentsAmount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Expected from active residents this month
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
                    <div className="text-2xl font-bold text-destructive">₹{reportSummaries.overduePaymentsAmount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Total outstanding from active residents (previous periods)
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>
          
          <section className="mt-8">
            <h2 className="text-2xl font-headline font-semibold mb-4 text-primary">Detailed Financial Logs</h2>
            <Tabs defaultValue="recentPayments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recentPayments"><Receipt className="mr-2 h-4 w-4" />Recent Payments</TabsTrigger>
                <TabsTrigger value="overdueResidents"><AlertTriangle className="mr-2 h-4 w-4" />Overdue Residents</TabsTrigger>
              </TabsList>
              <TabsContent value="recentPayments" className="mt-4">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="font-headline flex items-center">Recent Payments</CardTitle>
                    <CardDescription>Last 5 recorded payment transactions (from active residents).</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading && isClient ? <div className="text-center text-muted-foreground py-4">Loading details...</div> : reportSummaries.recentPayments.length > 0 ? (
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
                          {reportSummaries.recentPayments.map(p => (
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
              </TabsContent>
              <TabsContent value="overdueResidents" className="mt-4">
                <Card className="shadow-lg">
                  <CardHeader>
                      <CardTitle className="font-headline flex items-center text-destructive">Overdue Residents</CardTitle>
                      <CardDescription>Active residents with outstanding payments from previous periods.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading && isClient ? <div className="text-center text-muted-foreground py-4">Loading details...</div> : reportSummaries.overdueResidents.length > 0 ? (
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
                          {reportSummaries.overdueResidents.map(r => (
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
              </TabsContent>
            </Tabs>
          </section>
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-semibold text-primary">Attendance Overview</h2>
            <Link href="/dashboard/attendance" className="block hover:shadow-lg transition-shadow rounded-lg">
                <Card className="shadow-md h-full cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Attendance ({format(currentDisplayDate, 'dd MMM')})</CardTitle>
                    <ClipboardCheck className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
                    <div className="p-3 rounded-md bg-secondary">
                        <p className="text-muted-foreground">Present</p>
                        <p className="font-bold text-lg">{isLoading && isClient ? "-" : reportSummaries.presentToday}</p>
                    </div>
                    <div className="p-3 rounded-md bg-secondary">
                        <p className="text-muted-foreground">Late</p>
                        <p className="font-bold text-lg">{isLoading && isClient ? "-" : reportSummaries.lateToday}</p>
                    </div>
                    <div className="p-3 rounded-md bg-secondary">
                        <p className="text-muted-foreground">Absent</p>
                        <p className="font-bold text-lg">{isLoading && isClient ? "-" : reportSummaries.absentToday}</p>
                    </div>
                    <div className="p-3 rounded-md bg-secondary">
                        <p className="text-muted-foreground">On Leave</p>
                        <p className="font-bold text-lg">{isLoading && isClient ? "-" : reportSummaries.onLeaveToday}</p>
                    </div>
                    <div className="p-3 rounded-md bg-muted">
                        <p className="text-muted-foreground">Pending</p>
                        <p className="font-bold text-lg">{isLoading && isClient ? "-" : reportSummaries.pendingToday}</p>
                    </div>
                </CardContent>
                 <CardContent className="pt-2">
                    <Button variant="link" className="p-0 h-auto text-xs">View Detailed Attendance Log &rarr;</Button>
                 </CardContent>
                </Card>
            </Link>
             {isLoading && isClient && (
                <div className="flex justify-center items-center h-32">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
                </div>
            )}
          </section>
        </TabsContent>

        <TabsContent value="occupancy" className="mt-6">
          <section className="space-y-6">
            <h2 className="text-2xl font-headline font-semibold text-primary">Occupancy Overview</h2>
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/dashboard/rooms" className="block hover:shadow-lg transition-shadow rounded-lg">
                <Card className="shadow-md h-full cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
                    <Users className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{isLoading && isClient ? "-/-" : `${reportSummaries.occupiedBeds} / ${reportSummaries.totalCapacity}`}</div>
                    <p className="text-xs text-muted-foreground">Occupied Beds / Total Capacity</p>
                    </CardContent>
                </Card>
                </Link>
                <Link href="/dashboard/rooms" className="block hover:shadow-lg transition-shadow rounded-lg">
                <Card className="shadow-md h-full cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Vacant Beds</CardTitle>
                    <BedDouble className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{isLoading && isClient ? "-" : reportSummaries.vacantBeds}</div>
                    <p className="text-xs text-muted-foreground">Available spots in all rooms</p>
                    </CardContent>
                </Card>
                </Link>
                 <Card className="shadow-md h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Active Residents</CardTitle>
                    <Users className="h-4 w-4 text-accent" />
                    </CardHeader>
                    <CardContent>
                    <div className="text-2xl font-bold">{isLoading && isClient ? "-" : reportSummaries.totalActiveResidents}</div>
                    <p className="text-xs text-muted-foreground">Currently residing individuals</p>
                    </CardContent>
                </Card>
            </div>
             {isLoading && isClient && (
                <div className="flex justify-center items-center h-32">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
                </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

