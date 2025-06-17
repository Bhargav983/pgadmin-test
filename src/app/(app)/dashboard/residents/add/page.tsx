
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ResidentForm } from "../resident-form";
import type { Resident, ResidentFormValues, Room, ActivityType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

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

export default function AddResidentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);

  const fetchRooms = useCallback(() => {
    const storedRooms = getStoredData<Room>('pgRooms');
    const storedResidents = getStoredData<Resident>('pgResidents').map(res => ({
        ...res,
        status: res.status || 'active' 
    }));
    const roomsWithOccupancy = storedRooms.map(room => ({
      ...room,
      currentOccupancy: storedResidents.filter(resident => resident.roomId === room.id && (resident.status === 'active' || resident.status === 'upcoming')).length
    }));
    setAvailableRooms(roomsWithOccupancy);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const addActivityLogEntry = async (
    allResidents: Resident[],
    residentId: string,
    type: ActivityType,
    description: string,
    details?: Record<string, any>
  ): Promise<Resident[]> => {
    const updatedResidents = allResidents.map(res => {
      if (res.id === residentId) {
        const newLogEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          type,
          description,
          details,
        };
        return { ...res, activityLog: [...(res.activityLog || []), newLogEntry] };
      }
      return res;
    });
    setStoredData('pgResidents', updatedResidents);
    return updatedResidents;
  };

  const handleAddResident = async (values: ResidentFormValues) => {
    try {
      let allResidents = getStoredData<Resident>('pgResidents');
      const newResidentId = crypto.randomUUID();
      const newResident: Resident = { 
        ...values, 
        id: newResidentId,
        payments: [],
        activityLog: [], 
        roomId: values.roomId, // Will be null or a string ID from ResidentForm
        status: values.status || 'upcoming',
        photoUrl: values.photoUrl || null,
        idProofUrl: values.idProofUrl || null,
        guardianName: values.guardianName || null,
        guardianContact: values.guardianContact || null,
      };
      
      let updatedResidents = [...allResidents, newResident];
      setStoredData('pgResidents', updatedResidents); 

      const roomNumber = values.roomId ? availableRooms.find(r=>r.id === values.roomId)?.roomNumber : 'Unassigned';
      updatedResidents = await addActivityLogEntry(updatedResidents, newResidentId, 'RESIDENT_CREATED', `Resident record created for ${values.name}. Status: ${values.status}. Room: ${roomNumber}.`, { ...values, roomNumber });
      
      toast({ title: "Resident Added", description: `${newResident.name} has been added as ${values.status}.`, variant: "default" });
      router.push('/dashboard/residents');
    } catch (error) {
       toast({ title: "Error", description: "Failed to add resident.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/residents">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Residents</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-headline font-semibold flex items-center">
          <UserPlus className="mr-3 h-8 w-8 text-primary" />
          Add New Resident
        </h1>
      </div>
      <ResidentForm
        onSubmit={handleAddResident}
        isEditing={false}
        availableRooms={availableRooms}
        onCancel={() => router.push('/dashboard/residents')}
      />
    </div>
  );
}
