"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BedDouble, Users, DollarSign } from "lucide-react";
import type { Room, Resident } from "@/lib/types";

// Helper to get data from localStorage
const getStoredData = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

export default function DashboardPage() {
  const [roomCount, setRoomCount] = useState(0);
  const [residentCount, setResidentCount] = useState(0);
  const [totalRent, setTotalRent] = useState(0);

  useEffect(() => {
    const rooms = getStoredData<Room>('pgRooms');
    const residents = getStoredData<Resident>('pgResidents');
    
    setRoomCount(rooms.length);
    setResidentCount(residents.length);

    const currentMonthRent = rooms.reduce((acc, room) => {
        const residentsInRoom = residents.filter(r => r.roomId === room.id).length;
        // Assuming rent is per room, not per resident for this simple calculation
        if (residentsInRoom > 0) {
             return acc + room.rent;
        }
        return acc;
    }, 0);
    setTotalRent(currentMonthRent);

  }, []);


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">Dashboard Overview</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
            <Users className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{residentCount}</div>
            <p className="text-xs text-muted-foreground">Current number of residents</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Monthly Rent</CardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From occupied rooms</p>
          </CardContent>
        </Card>
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
