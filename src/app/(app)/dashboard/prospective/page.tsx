
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getProspectiveResidentColumns } from "./prospective-columns"; 
import { ResidentForm } from "@/app/(app)/dashboard/residents/resident-form"; // Reuse form
import type { Resident, ResidentFormValues, Room } from "@/lib/types";
import { PlusCircle, UserCheck } from "lucide-react";
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

export default function ProspectiveResidentsPage() {
  const [prospectiveResidents, setProspectiveResidents] = useState<Resident[]>([]);
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | undefined>(undefined);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<string | null>(null);

  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [residentToActivate, setResidentToActivate] = useState<Resident | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(() => {
    let storedResidents = getStoredData<Resident>('pgResidents');
    const storedRooms = getStoredData<Room>('pgRooms');

    storedResidents = storedResidents.map(res => ({
      ...res,
      status: res.status || 'active', 
      payments: Array.isArray(res.payments) ? res.payments : []
    }));
    
    setAllResidents(storedResidents);
    setProspectiveResidents(storedResidents.filter(res => res.status === 'upcoming'));

    const roomsWithOccupancy = storedRooms.map(room => ({
      ...room,
      currentOccupancy: storedResidents.filter(r => r.roomId === room.id && (r.status === 'active' || r.status === 'upcoming')).length
    }));
    setRooms(roomsWithOccupancy);

    if (typeof window !== 'undefined') {
      setStoredData('pgRooms', roomsWithOccupancy);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleStorageChange = () => fetchData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchData]);

  const handleAddResident = async (values: ResidentFormValues) => {
    try {
      const newResident: Resident = { 
        ...values, 
        id: crypto.randomUUID(),
        payments: [],
        roomId: values.roomId === "null" ? null : values.roomId
      };
      const updatedResidents = [...allResidents, newResident];
      setStoredData('pgResidents', updatedResidents);
      fetchData(); 
      setIsFormOpen(false);
      toast({ title: "Resident Added", description: `${newResident.name} has been added as ${newResident.status}.`, variant: "default" });
    } catch (error) {
       toast({ title: "Error", description: "Failed to add resident.", variant: "destructive" });
    }
  };

  const handleEditResident = async (values: ResidentFormValues) => {
    if (!editingResident) return;
    try {
      const updatedResidents = allResidents.map((res) =>
        res.id === editingResident.id ? { ...res, ...values, roomId: values.roomId === "null" ? null : values.roomId, payments: res.payments || [] } : res
      );
      setStoredData('pgResidents', updatedResidents);
      fetchData(); 
      setIsFormOpen(false);
      setEditingResident(undefined);
      toast({ title: "Resident Updated", description: `${values.name} has been updated.`, variant: "default" });
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
      const updatedResidents = allResidents.filter((res) => res.id !== residentToDelete);
      setStoredData('pgResidents', updatedResidents);
      fetchData(); 
      toast({ title: "Prospective Resident Deleted", description: "Record has been successfully deleted.", variant: "default" });
    } catch (error) {
       toast({ title: "Error", description: "Failed to delete prospective resident.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setResidentToDelete(null);
    }
  };

  const handleActivateConfirmation = (resident: Resident) => {
    setResidentToActivate(resident);
    setIsActivateDialogOpen(true);
  };

  const executeActivateResident = () => {
    if (!residentToActivate) return;
    try {
      const updatedResidents = allResidents.map(res => 
        res.id === residentToActivate.id ? { ...res, status: 'active' } : res
      );
      setStoredData('pgResidents', updatedResidents);
      fetchData();
      toast({ title: "Resident Activated", description: `${residentToActivate.name} is now active.`, variant: "default"});
    } catch (error) {
      toast({ title: "Error", description: "Failed to activate resident.", variant: "destructive" });
    } finally {
      setIsActivateDialogOpen(false);
      setResidentToActivate(null);
    }
  };

  const columns = getProspectiveResidentColumns(
    rooms, 
    openEditForm, 
    handleDeleteConfirmation,
    handleActivateConfirmation 
  );
  
  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-semibold">Manage Prospective Residents</h1>
        <Button onClick={() => { setEditingResident(undefined); setIsFormOpen(true); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Prospective
        </Button>
      </div>

      <DataTable columns={columns} data={prospectiveResidents} filterColumn="name" filterInputPlaceholder="Filter by name..." />

      <ResidentForm
        isOpen={isFormOpen}
        onClose={() => {setIsFormOpen(false); setEditingResident(undefined);}}
        onSubmit={editingResident ? handleEditResident : handleAddResident}
        defaultValues={editingResident || { status: 'upcoming' }} // Ensure new entries default to upcoming
        isEditing={!!editingResident}
        availableRooms={rooms}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this prospective resident?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete their record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResidentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteResident} className="bg-destructive hover:bg-destructive/90">
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Resident: {residentToActivate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change their status to 'Active'. They will then appear in the main residents list and be included in billing.
              Ensure room assignment is correct if applicable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResidentToActivate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeActivateResident} className="bg-green-600 hover:bg-green-700">
              <UserCheck className="mr-2 h-4 w-4" /> Activate Resident
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
