
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getRoomColumns } from "./room-columns";
import { RoomForm } from "./room-form";
import { RoomCard } from "@/components/room-card";
import type { Room, RoomFormValues, Resident } from "@/lib/types";
import { PlusCircle, List, LayoutGrid, Filter, Layers } from "lucide-react"; // Added Layers
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";


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

const setStoredData = <T,>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

interface FloorGroup {
  floorNumber: number;
  rooms: Room[];
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [groupedRoomsByFloor, setGroupedRoomsByFloor] = useState<FloorGroup[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchRoomsAndResidentsData = useCallback(() => {
    const storedRooms = getStoredData<Room>('pgRooms');
    const storedResidents = getStoredData<Resident>('pgResidents').map(res => ({
        ...res,
        status: res.status || 'active'
    }));
    setAllResidents(storedResidents);

    const roomsWithOccupancy = storedRooms.map(room => {
      const currentOccupancy = storedResidents.filter(resident => resident.roomId === room.id && (resident.status === 'active' || resident.status === 'upcoming')).length;
      const validFloorNumber = typeof room.floorNumber === 'number' && !isNaN(room.floorNumber) ? room.floorNumber : 0;
      return { ...room, floorNumber: validFloorNumber, currentOccupancy };
    });
    setRooms(roomsWithOccupancy);
  }, []);

  useEffect(() => {
    fetchRoomsAndResidentsData();
    const handleStorageChange = () => fetchRoomsAndResidentsData();
    window.addEventListener('storage', handleStorageChange);
    const handleDataChangedEvent = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.storeKey === 'pgResidents') {
            fetchRoomsAndResidentsData();
        }
    };
    window.addEventListener('dataChanged', handleDataChangedEvent);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('dataChanged', handleDataChangedEvent);
    };
  }, [fetchRoomsAndResidentsData]);

  useEffect(() => {
    let currentFilteredRoomsInternal = [...rooms];

    if (activeTab === 'full') {
      currentFilteredRoomsInternal = rooms.filter(room => room.capacity > 0 && room.currentOccupancy === room.capacity);
    } else if (activeTab === 'available') {
      currentFilteredRoomsInternal = rooms.filter(room => room.currentOccupancy > 0 && room.currentOccupancy < room.capacity);
    } else if (activeTab === 'vacant') {
      currentFilteredRoomsInternal = rooms.filter(room => room.currentOccupancy === 0);
    }

    if (selectedFloorFilter !== 'all') {
      currentFilteredRoomsInternal = currentFilteredRoomsInternal.filter(room => room.floorNumber === parseInt(selectedFloorFilter));
    }

    if (searchTerm) {
        currentFilteredRoomsInternal = currentFilteredRoomsInternal.filter(room =>
            room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (room.facilities && room.facilities.join(', ').toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }
    
    currentFilteredRoomsInternal.sort((a,b) => a.roomNumber.localeCompare(b.roomNumber));
    setFilteredRooms(currentFilteredRoomsInternal);

    // Grouping logic for card view
    if (viewMode === 'card') {
        const groups: Record<number, Room[]> = {};
        currentFilteredRoomsInternal.forEach(room => {
            const floor = room.floorNumber;
            if (!groups[floor]) {
            groups[floor] = [];
            }
            groups[floor].push(room);
        });

        const processedGroups = Object.entries(groups)
            .map(([floorNum, roomList]) => ({
            floorNumber: parseInt(floorNum),
            rooms: roomList.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
            }))
            .sort((a, b) => a.floorNumber - b.floorNumber);
        setGroupedRoomsByFloor(processedGroups);
    }

  }, [rooms, activeTab, selectedFloorFilter, searchTerm, viewMode]);

  const floorNumbersForFilter = useMemo(() => {
    const uniqueFloors = Array.from(new Set(rooms.map(room => room.floorNumber))).sort((a, b) => a - b);
    return uniqueFloors;
  }, [rooms]);


  const handleAddRoom = async (values: RoomFormValues) => {
    try {
      const newRoom: Room = {
        id: crypto.randomUUID(),
        roomNumber: values.roomNumber,
        capacity: values.capacity,
        rent: values.rent,
        floorNumber: values.floorNumber,
        facilities: values.facilities ? values.facilities.split(',').map(f => f.trim()).filter(f => f) : [],
        currentOccupancy: 0,
      };
      const updatedRooms = [...rooms, newRoom];
      setStoredData('pgRooms', updatedRooms);
      fetchRoomsAndResidentsData();
      setIsFormOpen(false);
      toast({ title: "Room Added", description: `Room ${newRoom.roomNumber} has been successfully added.`, variant: "default" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add room.", variant: "destructive" });
    }
  };

  const handleEditRoom = async (values: RoomFormValues) => {
    if (!editingRoom) return;
    try {
      const updatedRooms = rooms.map((room) =>
        room.id === editingRoom.id ? {
            ...room,
            roomNumber: values.roomNumber,
            capacity: values.capacity,
            rent: values.rent,
            floorNumber: values.floorNumber,
            facilities: values.facilities ? values.facilities.split(',').map(f => f.trim()).filter(f => f) : [],
        } : room
      );
      setStoredData('pgRooms', updatedRooms);
      fetchRoomsAndResidentsData();
      setIsFormOpen(false);
      setEditingRoom(undefined);
      toast({ title: "Room Updated", description: `Room ${values.roomNumber} has been successfully updated.`, variant: "default" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update room.", variant: "destructive" });
    }
  };

  const openEditForm = (room: Room) => {
    setEditingRoom(room);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (roomId: string) => {
    setRoomToDelete(roomId);
    setIsDeleteDialogOpen(true);
  };

  const executeDeleteRoom = () => {
    if (!roomToDelete) return;
    try {
      const residentsInRoom = allResidents.filter(resident => resident.roomId === roomToDelete && (resident.status === 'active' || resident.status === 'upcoming'));

      if (residentsInRoom.length > 0) {
        toast({ title: "Deletion Forbidden", description: "Cannot delete room. It is currently occupied or reserved by residents.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setRoomToDelete(null);
        return;
      }

      const updatedRooms = rooms.filter((room) => room.id !== roomToDelete);
      setStoredData('pgRooms', updatedRooms);
      fetchRoomsAndResidentsData();
      toast({ title: "Room Deleted", description: "Room has been successfully deleted.", variant: "default" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete room.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  const columns = getRoomColumns(openEditForm, handleDeleteConfirmation);

  const getFloorLabel = (floorNum: number) => floorNum === 0 ? "Ground Floor" : `Floor ${floorNum}`;

  return (
    <div className="container mx-auto py-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-headline font-semibold">Manage Rooms</h1>
        <div className="flex flex-wrap items-center gap-2">
           <Select value={selectedFloorFilter} onValueChange={setSelectedFloorFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4 opacity-50" />
              <SelectValue placeholder="Filter by Floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floorNumbersForFilter.map(floor => (
                <SelectItem key={floor} value={floor.toString()}>
                  {getFloorLabel(floor)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant={viewMode === 'table' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('table')} aria-label="Table View">
            <List className="h-5 w-5" />
          </Button>
          <Button variant={viewMode === 'card' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('card')} aria-label="Card View">
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button onClick={() => { setEditingRoom(undefined); setIsFormOpen(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Room
          </Button>
        </div>
      </div>

       <Input
          placeholder="Search by room no. or facility..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm mb-4"
      />

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="all">All ({rooms.filter(r => (selectedFloorFilter === 'all' || r.floorNumber === parseInt(selectedFloorFilter)) && (searchTerm === "" || r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (r.facilities && r.facilities.join(', ').toLowerCase().includes(searchTerm.toLowerCase())))).length})</TabsTrigger>
          <TabsTrigger value="full">Full ({rooms.filter(r => r.capacity > 0 && r.currentOccupancy === r.capacity && (selectedFloorFilter === 'all' || r.floorNumber === parseInt(selectedFloorFilter)) && (searchTerm === "" || r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (r.facilities && r.facilities.join(', ').toLowerCase().includes(searchTerm.toLowerCase())))).length})</TabsTrigger>
          <TabsTrigger value="available">Available ({rooms.filter(r => r.currentOccupancy > 0 && r.currentOccupancy < r.capacity && (selectedFloorFilter === 'all' || r.floorNumber === parseInt(selectedFloorFilter)) && (searchTerm === "" || r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (r.facilities && r.facilities.join(', ').toLowerCase().includes(searchTerm.toLowerCase())))).length})</TabsTrigger>
          <TabsTrigger value="vacant">Vacant ({rooms.filter(r => r.currentOccupancy === 0 && (selectedFloorFilter === 'all' || r.floorNumber === parseInt(selectedFloorFilter)) && (searchTerm === "" || r.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) || (r.facilities && r.facilities.join(', ').toLowerCase().includes(searchTerm.toLowerCase())))).length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'table' ? (
        filteredRooms.length > 0 ? (
          <DataTable columns={columns} data={filteredRooms} filterColumn="roomNumber" />
        ) : (
          <div className="col-span-full text-center py-10 bg-card border rounded-md">
            <p className="text-muted-foreground">No rooms match the current filter criteria.</p>
          </div>
        )
      ) : (
        groupedRoomsByFloor.length > 0 ? (
          <div className="space-y-8 mt-4">
            {groupedRoomsByFloor.map(floorGroup => (
              <section key={floorGroup.floorNumber}>
                <h2 className="text-2xl font-headline font-semibold mb-1 flex items-center">
                  <Layers className="mr-3 h-6 w-6 text-primary" />
                  {getFloorLabel(floorGroup.floorNumber)}
                  <span className="ml-2 text-base font-normal text-muted-foreground">({floorGroup.rooms.length} room(s))</span>
                </h2>
                <Separator className="mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {floorGroup.rooms.map(room => (
                    <RoomCard key={room.id} room={room} residents={allResidents} onEdit={openEditForm} onDelete={handleDeleteConfirmation} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="col-span-full text-center py-10 bg-card border rounded-md mt-4">
            <p className="text-muted-foreground">No rooms match the current filter criteria.</p>
          </div>
        )
      )}

      <RoomForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingRoom(undefined);}}
        onSubmit={editingRoom ? handleEditRoom : handleAddRoom}
        defaultValues={editingRoom}
        isEditing={!!editingRoom}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the room.
              Make sure the room is not occupied or reserved before deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoomToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteRoom} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

