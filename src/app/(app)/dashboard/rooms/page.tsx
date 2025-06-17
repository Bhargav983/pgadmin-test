
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getRoomColumns } from "./room-columns";
import { RoomForm } from "./room-form";
import type { Room, RoomFormValues, Resident } from "@/lib/types";
import { PlusCircle } from "lucide-react";
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


export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchRoomsAndOccupancy = useCallback(() => {
    const storedRooms = getStoredData<Room>('pgRooms');
    const storedResidents = getStoredData<Resident>('pgResidents').map(res => ({
        ...res,
        status: res.status || 'active' 
    }));

    const roomsWithOccupancy = storedRooms.map(room => {
      // Occupancy includes active and upcoming residents assigned to this room
      const currentOccupancy = storedResidents.filter(resident => resident.roomId === room.id && (resident.status === 'active' || resident.status === 'upcoming')).length;
      return { ...room, currentOccupancy };
    });
    setRooms(roomsWithOccupancy);
  }, []);

  useEffect(() => {
    fetchRoomsAndOccupancy();
    // Listen to storage changes to keep data in sync across tabs/components if needed
    const handleStorageChange = () => fetchRoomsAndOccupancy();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchRoomsAndOccupancy]);


  const handleAddRoom = async (values: RoomFormValues) => {
    try {
      const newRoom: Room = { 
        ...values, 
        id: crypto.randomUUID(),
        currentOccupancy: 0, 
      };
      const updatedRooms = [...rooms, newRoom];
      setStoredData('pgRooms', updatedRooms);
      fetchRoomsAndOccupancy(); 
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
        room.id === editingRoom.id ? { ...room, ...values, currentOccupancy: room.currentOccupancy } : room // Preserve currentOccupancy on edit
      );
      setStoredData('pgRooms', updatedRooms);
      fetchRoomsAndOccupancy(); // Re-fetch to ensure occupancy is up-to-date from resident list
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
      const residents = getStoredData<Resident>('pgResidents');
      // Check if any resident (active or upcoming) is assigned to this room
      const roomHasResidents = residents.some(resident => resident.roomId === roomToDelete && (resident.status === 'active' || resident.status === 'upcoming'));

      if (roomHasResidents) {
        toast({ title: "Deletion Forbidden", description: "Cannot delete room. It is currently occupied or reserved by residents.", variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setRoomToDelete(null);
        return;
      }

      const updatedRooms = rooms.filter((room) => room.id !== roomToDelete);
      setStoredData('pgRooms', updatedRooms);
      fetchRoomsAndOccupancy();
      toast({ title: "Room Deleted", description: "Room has been successfully deleted.", variant: "default" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete room.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };


  const columns = getRoomColumns(openEditForm, handleDeleteConfirmation);

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-semibold">Manage Rooms</h1>
        <Button onClick={() => { setEditingRoom(undefined); setIsFormOpen(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Room
        </Button>
      </div>

      <DataTable columns={columns} data={rooms} filterColumn="roomNumber" filterInputPlaceholder="Filter by room number..." />

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
