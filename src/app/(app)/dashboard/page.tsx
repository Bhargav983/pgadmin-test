
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, Users, IndianRupee, UserPlus, ClipboardCheck, PieChartIcon } from "lucide-react"; 
import type { Room, Resident, AttendanceRecord } from "@/lib/types";
import Link from 'next/link';
import { format, startOfDay } from 'date-fns';

const getStoredData = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch(e) {
    console.error("Failed to parse localStorage for key:", key, e);
    return [];
  }
};

export default function DashboardPage() {
  const [roomCount, setRoomCount] = useState(0);
  const [activeResidentCount, setActiveResidentCount] = useState(0);
  const [upcomingResidentCount, setUpcomingResidentCount] = useState(0);
  const [totalRent, setTotalRent] = useState(0);

  // New state for additional cards
  const [presentTodayCount, setPresentTodayCount] = useState(0);
  const [absentTodayCount, setAbsentTodayCount] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [vacantBeds, setVacantBeds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const rooms = getStoredData<Room>('pgRooms');
    const residents = getStoredData<Resident>('pgResidents').map(r => ({...r, status: r.status || 'active'}));
    const attendanceRecords = getStoredData<AttendanceRecord>('pgAttendanceRecords');
    
    setRoomCount(rooms.length);
    const currentActiveResidents = residents.filter(r => r.status === 'active');
    setActiveResidentCount(currentActiveResidents.length);
    setUpcomingResidentCount(residents.filter(r => r.status === 'upcoming').length);

    const currentMonthRent = rooms.reduce((acc, room) => {
        const activeResidentsInRoom = residents.filter(r => r.roomId === room.id && r.status === 'active').length;
        if (activeResidentsInRoom > 0) {
             return acc + room.rent; 
        }
        return acc;
    }, 0);
    setTotalRent(currentMonthRent);

    // Calculate Today's Attendance
    const todayFormatted = format(startOfDay(new Date()), 'yyyy-MM-dd');
    let present = 0;
    let absent = 0;
    const activeResidentIds = new Set(currentActiveResidents.map(r => r.id));

    attendanceRecords.forEach(record => {
      if (record.date === todayFormatted && activeResidentIds.has(record.residentId)) {
        if (record.status === 'Present' || record.status === 'Late') {
          present++;
        } else if (record.status === 'Absent') {
          absent++;
        }
      }
    });
    setPresentTodayCount(present);
    setAbsentTodayCount(absent);

    // Calculate Occupancy
    const capacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    setTotalCapacity(capacity);
    setVacantBeds(Math.max(0, capacity - currentActiveResidents.length));
    
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-semibold">Dashboard Overview</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"> 
        <Link href="/dashboard/rooms" className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
          <Card className="shadow-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <BedDouble className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roomCount}</div>
              <p className="text-xs text-muted-foreground">Managed rooms in the PG</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/residents" className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
          <Card className="shadow-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Residents</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeResidentCount}</div>
              <p className="text-xs text-muted-foreground">Currently residing</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/residents" className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
          <Card className="shadow-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Residents</CardTitle>
                <UserPlus className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{upcomingResidentCount}</div>
                <p className="text-xs text-muted-foreground">Joining soon</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/billing" className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
          <Card className="shadow-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expected Monthly Rent</CardTitle>
              <IndianRupee className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From active residents</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/attendance" className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
          <Card className="shadow-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presentTodayCount} Present</div>
              <p className="text-xs text-muted-foreground">{absentTodayCount} Absent / On Leave</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/rooms" className="block hover:shadow-xl transition-shadow duration-300 rounded-lg">
          <Card className="shadow-lg h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
              <PieChartIcon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeResidentCount} / {totalCapacity} Beds</div>
              <p className="text-xs text-muted-foreground">{vacantBeds} Vacant</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
