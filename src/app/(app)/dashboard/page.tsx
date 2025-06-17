
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, Users, DollarSign, UserPlus, UserX } from "lucide-react"; 
import type { Room, Resident } from "@/lib/types";
import Link from 'next/link';

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
  const [formerResidentCount, setFormerResidentCount] = useState(0);
  const [totalRent, setTotalRent] = useState(0);

  useEffect(() => {
    const rooms = getStoredData<Room>('pgRooms');
    const residents = getStoredData<Resident>('pgResidents').map(r => ({...r, status: r.status || 'active'}));
    
    setRoomCount(rooms.length);
    setActiveResidentCount(residents.filter(r => r.status === 'active').length);
    setUpcomingResidentCount(residents.filter(r => r.status === 'upcoming').length);
    setFormerResidentCount(residents.filter(r => r.status === 'former').length);

    const currentMonthRent = rooms.reduce((acc, room) => {
        const activeResidentsInRoom = residents.filter(r => r.roomId === room.id && r.status === 'active').length;
        if (activeResidentsInRoom > 0) {
             return acc + room.rent;
        }
        return acc;
    }, 0);
    setTotalRent(currentMonthRent);

  }, []);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">Dashboard Overview</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> 
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <BedDouble className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roomCount}</div>
            <p className="text-xs text-muted-foreground">Managed rooms in the PG</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Residents</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeResidentCount}</div>
            <p className="text-xs text-muted-foreground">Currently active residents</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Residents</CardTitle>
              <UserPlus className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{upcomingResidentCount}</div>
              <p className="text-xs text-muted-foreground">Prospective or joining soon</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Monthly Rent</CardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From active residents</p>
          </CardContent>
        </Card>
        {/* Optional: Card for Former Residents
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Former Residents</CardTitle>
              <UserX className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{formerResidentCount}</div>
              <p className="text-xs text-muted-foreground">Previously stayed residents</p>
          </CardContent>
        </Card>
        */}
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity to display. Check back later!</p>
          {/* Placeholder for future activity feed */}
        </CardContent>
      </Card>
    </div>
  );
}
