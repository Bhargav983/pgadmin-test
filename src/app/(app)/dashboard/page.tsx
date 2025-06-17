
"use client";

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BedDouble, Users, IndianRupee, UserPlus, ClipboardCheck, PieChartIcon, BarChartHorizontalBig } from "lucide-react"; 
import type { Room, Resident, Payment, AttendanceRecord } from "@/lib/types";
import Link from 'next/link';
import { format, startOfDay, getMonth, getYear, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";


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

interface RentCollectionData {
  name: string;
  value: number;
  fill: string;
}

interface OccupancyData {
  name: string;
  value: number;
  fill: string;
}

interface ResidentStatusData {
  name: string;
  value: number;
  fill: string;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))", 
  "hsl(var(--chart-2))", 
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];


export default function DashboardPage() {
  const [roomCount, setRoomCount] = useState(0);
  const [activeResidentCount, setActiveResidentCount] = useState(0);
  const [upcomingResidentCount, setUpcomingResidentCount] = useState(0);
  const [totalExpectedRent, setTotalExpectedRent] = useState(0);

  const [presentTodayCount, setPresentTodayCount] = useState(0);
  const [absentTodayCount, setAbsentTodayCount] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(0);
  const [vacantBeds, setVacantBeds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [rentCollectionData, setRentCollectionData] = useState<RentCollectionData[]>([]);
  const [roomOccupancyData, setRoomOccupancyData] = useState<OccupancyData[]>([]);
  const [residentStatusChartData, setResidentStatusChartData] = useState<ResidentStatusData[]>([]);


  useEffect(() => {
    setIsLoading(true);
    const rooms = getStoredData<Room>('pgRooms');
    const residents = getStoredData<Resident>('pgResidents').map(r => ({
        ...r, 
        status: r.status || 'active', 
        payments: r.payments || [],
        monthlyDiscountAmount: r.monthlyDiscountAmount || 0,
    }));
    const attendanceRecords = getStoredData<AttendanceRecord>('pgAttendanceRecords');
    
    setRoomCount(rooms.length);
    const currentActiveResidents = residents.filter(r => r.status === 'active');
    const currentUpcomingResidents = residents.filter(r => r.status === 'upcoming');
    const currentFormerResidents = residents.filter(r => r.status === 'former');

    setActiveResidentCount(currentActiveResidents.length);
    setUpcomingResidentCount(currentUpcomingResidents.length);

    const expectedRent = currentActiveResidents.reduce((acc, resident) => {
        const room = rooms.find(r => r.id === resident.roomId);
        const discount = resident.monthlyDiscountAmount || 0;
        return acc + (room ? Math.max(0, room.rent - discount) : 0);
    }, 0);
    setTotalExpectedRent(expectedRent);

    const todayFormatted = format(startOfDay(new Date()), 'yyyy-MM-dd');
    let present = 0;
    let absent = 0;
    const activeResidentIds = new Set(currentActiveResidents.map(r => r.id));

    attendanceRecords.forEach(record => {
      if (record.date === todayFormatted && activeResidentIds.has(record.residentId)) {
        if (record.status === 'Present' || record.status === 'Late') {
          present++;
        } else if (record.status === 'Absent' || record.status === 'On Leave') { 
          absent++;
        }
      }
    });
    setPresentTodayCount(present);
    setAbsentTodayCount(absent);

    const capacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    setTotalCapacity(capacity);
    setVacantBeds(Math.max(0, capacity - currentActiveResidents.length));
    
    const currentMonth = getMonth(new Date()) + 1; 
    const currentYear = getYear(new Date());
    
    const collectedThisMonth = currentActiveResidents.reduce((totalCollected, resident) => {
        const room = rooms.find(r => r.id === resident.roomId);
        if (room) {
            // No need to consider discount here as payments are actual amounts collected
            const paymentsForMonth = (resident.payments || []).filter(
                p => p.month === currentMonth && p.year === currentYear && p.roomId === room.id
            );
            return totalCollected + paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
        }
        return totalCollected;
    }, 0);

    setRentCollectionData([
      { name: 'Expected (Net)', value: expectedRent, fill: CHART_COLORS[0] }, // Expected is now net of discounts
      { name: 'Collected', value: collectedThisMonth, fill: CHART_COLORS[1] }
    ]);

    let fullRooms = 0;
    let partiallyOccupiedRooms = 0;
    let vacantRooms = 0;
    rooms.forEach(room => {
      const occupants = currentActiveResidents.filter(res => res.roomId === room.id).length;
      if (occupants === 0) {
        vacantRooms++;
      } else if (occupants >= room.capacity) {
        fullRooms++;
      } else {
        partiallyOccupiedRooms++;
      }
    });
    setRoomOccupancyData([
      { name: 'Full', value: fullRooms, fill: CHART_COLORS[0] },
      { name: 'Partial', value: partiallyOccupiedRooms, fill: CHART_COLORS[1] },
      { name: 'Vacant', value: vacantRooms, fill: CHART_COLORS[2] }
    ]);

    setResidentStatusChartData([
        { name: 'Active', value: currentActiveResidents.length, fill: CHART_COLORS[0] },
        { name: 'Upcoming', value: currentUpcomingResidents.length, fill: CHART_COLORS[1] },
        { name: 'Former', value: currentFormerResidents.length, fill: CHART_COLORS[2] },
    ]);

    setIsLoading(false);
  }, []);

  const pieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentage = (percent * 100).toFixed(0);

    if (percentage === "0") return null; 

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${name} (${percentage}%)`}
      </text>
    );
  };

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
              <CardTitle className="text-sm font-medium">Expected Monthly Rent (Net)</CardTitle>
              <IndianRupee className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalExpectedRent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From active residents (after discounts)</p>
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

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><BarChartHorizontalBig className="mr-2 h-5 w-5 text-primary"/>Monthly Rent Collection</CardTitle>
                <CardDescription>Expected Net Rent vs. Collected rent for {format(new Date(), 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                <ChartContainer config={{}} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rentCollectionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                            <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                content={<ChartTooltipContent />}
                                cursor={{ fill: 'hsl(var(--muted))' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                                {rentCollectionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                 <LabelList dataKey="value" position="right" offset={8} className="fill-foreground text-xs" formatter={(value: number) => `₹${value.toLocaleString()}`} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary"/>Room Occupancy Status</CardTitle>
                <CardDescription>Distribution of rooms by occupancy.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                 <ChartContainer config={{}} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                            <Pie
                                data={roomOccupancyData.filter(d => d.value > 0)} 
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                labelLine={false}
                                label={pieLabel}
                            >
                                {roomOccupancyData.filter(d => d.value > 0).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                                ))}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} iconSize={10} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
       <div className="grid gap-6 md:grid-cols-1">
         <Card className="shadow-lg lg:max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="font-headline flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/>Resident Status Breakdown</CardTitle>
                <CardDescription>Overview of resident statuses.</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                 <ChartContainer config={{}} className="w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                            <Pie
                                data={residentStatusChartData.filter(d => d.value > 0)}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                labelLine={false}
                                label={pieLabel}
                            >
                                {residentStatusChartData.filter(d => d.value > 0).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill}/>
                                ))}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} iconSize={10} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
