
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Resident, Room, Payment, ActivityLogEntry } from '@/lib/types';
import { format } from 'date-fns';
import { ArrowLeft, User, Phone, CalendarDays, BedDouble, Wallet, ReceiptText, History, Info } from 'lucide-react';

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

export default function ResidentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const residentId = params.residentId as string;

  const [resident, setResident] = useState<Resident | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResidentDetails = useCallback(() => {
    setIsLoading(true);
    const allResidents = getStoredData<Resident>('pgResidents');
    const storedRooms = getStoredData<Room>('pgRooms');
    
    const foundResident = allResidents.find(r => r.id === residentId);
    
    if (foundResident) {
      setResident(foundResident);
      setRooms(storedRooms);
    } else {
      setResident(null); // Handle resident not found
    }
    setIsLoading(false);
  }, [residentId]);

  useEffect(() => {
    fetchResidentDetails();
  }, [fetchResidentDetails]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/residents">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Residents</span>
          </Link>
        </Button>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-destructive">Resident Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The resident you are looking for does not exist or could not be found.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/residents">Go to Residents List</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRoom = resident.roomId ? rooms.find(r => r.id === resident.roomId) : null;
  const sortedPayments = resident.payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedActivityLog = resident.activityLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getRoomNumberFromId = (roomId: string | null | undefined): string => {
    if (!roomId) return 'N/A';
    const room = rooms.find(r => r.id === roomId);
    return room ? room.roomNumber : 'Unknown Room';
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <Button variant="outline" size="icon" asChild>
                <Link href="/dashboard/residents">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Residents</span>
                </Link>
            </Button>
            <h1 className="text-3xl font-headline font-semibold flex items-center">
                <User className="mr-3 h-8 w-8 text-primary" />
                {resident.name} - Details
            </h1>
        </div>
        <Badge variant={resident.status === 'active' ? 'default' : (resident.status === 'upcoming' ? 'secondary' : 'outline')}
               className={resident.status === 'active' ? 'bg-green-500 text-white' : (resident.status === 'former' ? 'bg-destructive text-destructive-foreground' : '')}>
          Status: {resident.status.charAt(0).toUpperCase() + resident.status.slice(1)}
        </Badge>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Info className="mr-2 h-5 w-5 text-accent" />Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
          <div><Phone className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Contact:</strong> {resident.contact}</div>
          <div><CalendarDays className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Enquiry Date:</strong> {resident.enquiryDate ? format(new Date(resident.enquiryDate), 'dd MMM, yyyy') : 'N/A'}</div>
          <div><CalendarDays className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Joining Date:</strong> {resident.joiningDate ? format(new Date(resident.joiningDate), 'dd MMM, yyyy') : 'N/A'}</div>
          <div><BedDouble className="inline mr-2 h-4 w-4 text-muted-foreground" /><strong>Current Room:</strong> {currentRoom ? currentRoom.roomNumber : (resident.status === 'former' ? 'Vacated' : 'Unassigned')}</div>
          <div className="md:col-span-2 lg:col-span-3"><strong className="text-muted-foreground">Personal Info:</strong> {resident.personalInfo || 'N/A'}</div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><Wallet className="mr-2 h-5 w-5 text-primary" />Payment History</CardTitle>
          <CardDescription>All recorded payments for {resident.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>For Period</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Room (at payment)</TableHead>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayments.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{format(new Date(p.date), 'dd MMM, yyyy')}</TableCell>
                    <TableCell>₹{p.amount.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(p.year, p.month - 1), 'MMM yyyy')}</TableCell>
                    <TableCell><Badge variant="outline">{p.mode}</Badge></TableCell>
                    <TableCell>{getRoomNumberFromId(p.roomId)}</TableCell>
                    <TableCell className="font-mono text-xs">{p.receiptId || 'N/A'}</TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{p.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No payment history found for this resident.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center"><History className="mr-2 h-5 w-5 text-accent" />Activity Log</CardTitle>
          <CardDescription>Chronological history of activities related to {resident.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedActivityLog.length > 0 ? (
            <div className="space-y-4">
              {sortedActivityLog.map(log => (
                <div key={log.id} className="p-3 border rounded-md bg-secondary/30">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold text-sm text-primary">
                      {log.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(log.timestamp), 'dd MMM, yyyy, hh:mm a')}
                    </p>
                  </div>
                  <p className="text-sm text-foreground">{log.description}</p>
                  {log.details && Object.keys(log.details).length > 0 && (
                     <details className="mt-1 text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">More Details</summary>
                        <pre className="mt-1 p-2 bg-background rounded-md overflow-x-auto text-xs">
                           {JSON.stringify(log.details, (key, value) => {
                               if (key === 'roomId' && value) return `${value} (${getRoomNumberFromId(value)})`;
                               if (key === 'oldRoomId' && value) return `${value} (${getRoomNumberFromId(value)})`;
                               if (key === 'toRoomId' && value) return `${value} (${getRoomNumberFromId(value)})`;
                               if (key === 'vacatedFromRoomId' && value) return `${value} (${getRoomNumberFromId(value)})`;
                               return value;
                           }, 2)}
                        </pre>
                     </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No activity log found for this resident.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

