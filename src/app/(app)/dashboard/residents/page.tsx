"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getResidentColumns } from "./resident-columns";
import { ResidentForm } from "./resident-form";
import type { Resident, ResidentFormValues, Room } from "@/lib/types";
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

// Helper to get data from localStorage
const getStoredData = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
};

// Helper to set data to localStorage
const setStoredData = <T,>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(() => {
    const storedResidents = getStoredData<Resident>('pgResidents');
    const storedRooms = getStoredData<Room>('pgRooms');

    // Update room occupancy
    const roomsWithOccupancy = storedRooms.map(room => ({
      ...room,
      currentOccupancy: storedResidents.filter(resident => resident.roomId === room.id).length
    }));
    
    setResidents(storedResidents);
    setRooms(roomsWithOccupancy);
    // Persist updated room occupancy back to localStorage for consistency
    setStoredData('pgRooms', roomsWithOccupancy);

  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddResident = async (values: ResidentFormValues) => {
    try {
      const newResident: Resident = { ...values, id: crypto.randomUUID() };
      const updatedResidents = [...residents, newResident];
      setStoredData('pgResidents', updatedResidents);
      fetchData(); // Re-fetch to update residents list and room occupancy
      setIsFormOpen(false);
      toast({ title: "Resident Added", description: `${newResident.name} has been successfully added.`, variant: "default" });
    } catch (error) {
       toast({ title: "Error", description: "Failed to add resident.", variant: "destructive" });
    }
  };

  const handleEditResident = async (values: ResidentFormValues) => {
    if (!editingResident) return;
    try {
      const updatedResidents = residents.map((res) =>
        res.id === editingResident.id ? { ...res, ...values } : res
      );
      setStoredData('pgResidents', updatedResidents);
      fetchData(); // Re-fetch to update residents list and room occupancy
      setIsFormOpen(false);
      setEditingResident(undefined);
      toast({ title: "Resident Updated", description: `${values.name} has been successfully updated.`, variant: "default" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update resident.", variant: "destructive" });
    }
  };

  const openEditForm = (resident: Resident) => {
    setEditingResident(resident);
    setIsFormOpen(true);
  };

  const handleDeleteConfirmation = (residentId: string) => {
    setResidentToDelete(residentId);
    setIsDeleteDialogOpen(true);
  };

  const executeDeleteResident = () => {
    if (!residentToDelete) return;
    try {
      const updatedResidents = residents.filter((res) => res.id !== residentToDelete);
      setStoredData('pgResidents', updatedResidents);
      fetchData(); // Re-fetch to update residents list and room occupancy
      toast({ title: "Resident Deleted", description: "Resident has been successfully deleted.", variant: "default" });
    } catch (error) {
       toast({ title: "Error", description: "Failed to delete resident.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setResidentToDelete(null);
    }
  };

  const columns = getResidentColumns(rooms, openEditForm, handleDeleteConfirmation);

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-semibold">Manage Residents</h1>
        <Button onClick={() => { setEditingResident(undefined); setIsFormOpen(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Resident
        </Button>
      </div>

      <DataTable columns={columns} data={residents} filterColumn="name" filterInputPlaceholder="Filter by name..." />

      <ResidentForm
        isOpen={isFormOpen}
        onClose={() => {setIsFormOpen(false); setEditingResident(undefined);}}
        onSubmit={editingResident ? handleEditResident : handleAddResident}
        defaultValues={editingResident}
        isEditing={!!editingResident}
        availableRooms={rooms}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resident.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResidentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteResident} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
