
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ResidentForm } from "@/app/(app)/dashboard/residents/resident-form";
import type { Resident, ResidentFormValues, Room, ResidentStatus, ActivityType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCog } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


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

export default function EditResidentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const residentId = params.residentId as string;
  const activateAfterSave = searchParams.get('activate') === 'true';

  const { toast } = useToast();
  const [editingResident, setEditingResident] = useState<Resident | undefined>(undefined);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addActivityLogEntry = async (
    allResidents: Resident[],
    currentResidentId: string,
    type: ActivityType,
    description: string,
    details?: Record<string, any>
  ): Promise<Resident[]> => {
    const updatedResidents = allResidents.map(res => {
      if (res.id === currentResidentId) {
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

  const fetchResidentAndRooms = useCallback(() => {
    setIsLoading(true);
    const storedResidents = getStoredData<Resident>('pgResidents');
    const foundResident = storedResidents.find(r => r.id === residentId);
    setEditingResident(foundResident);

    const storedRooms = getStoredData<Room>('pgRooms');
    const roomsWithOccupancy = storedRooms.map(room => ({
      ...room,
      currentOccupancy: storedResidents.filter(res => res.roomId === room.id && (res.status === 'active' || res.status === 'upcoming')).length
    }));
    setAvailableRooms(roomsWithOccupancy);
    setIsLoading(false);
  }, [residentId]);

  useEffect(() => {
    fetchResidentAndRooms();
  }, [fetchResidentAndRooms]);

  const handleEditResident = async (values: ResidentFormValues) => {
    if (!editingResident) return;

    try {
      let allResidents = getStoredData<Resident>('pgResidents');
      const oldResidentData = allResidents.find(res => res.id === editingResident.id);
      
      let updatedResidents = allResidents.map((res) =>
        res.id === editingResident.id ? { 
          ...res, 
          ...values, 
          roomId: values.roomId === "null" ? null : values.roomId,
          photoUrl: values.photoUrl || null,
          idProofUrl: values.idProofUrl || null,
          guardianName: values.guardianName || null,
          guardianContact: values.guardianContact || null,
          payments: res.payments || [], // Preserve existing payments
          activityLog: res.activityLog || [] // Preserve existing activity log
        } : res
      );
      setStoredData('pgResidents', updatedResidents);

      const roomNumber = values.roomId ? availableRooms.find(r=>r.id === values.roomId)?.roomNumber : 'Unassigned';
      let updateDescription = `Details updated for ${values.name}.`;
      if (oldResidentData?.roomId !== values.roomId && !(values.status === 'former' && !values.roomId)) {
         updateDescription += ` Room changed from ${availableRooms.find(r=>r.id === oldResidentData?.roomId)?.roomNumber || 'Unassigned'} to ${roomNumber || 'Unassigned'}.`;
         updatedResidents = await addActivityLogEntry(updatedResidents, editingResident.id, 'ROOM_ASSIGNED', `Assigned to room: ${roomNumber || 'Unassigned'}.`, { oldRoomId: oldResidentData?.roomId, newRoomId: values.roomId });
      }
      if (oldResidentData?.status !== values.status) {
        updateDescription += ` Status changed from ${oldResidentData?.status} to ${values.status}.`;
      }
      updatedResidents = await addActivityLogEntry(updatedResidents, editingResident.id, 'DETAILS_UPDATED', updateDescription, { oldValues: oldResidentData, newValues: values });
      
      toast({ title: "Resident Updated", description: `${values.name} has been updated.`, variant: "default" });

      if (activateAfterSave && values.roomId && values.roomId !== "null") {
        updatedResidents = updatedResidents.map(res => 
            res.id === editingResident.id ? { ...res, status: 'active' as ResidentStatus } : res
        );
        setStoredData('pgResidents', updatedResidents);
        updatedResidents = await addActivityLogEntry(updatedResidents, editingResident.id, 'ACTIVATED', `${values.name} activated and assigned to room ${roomNumber}.`, { roomId: values.roomId, roomNumber });
        toast({ title: "Resident Activated", description: `${values.name} assigned room ${roomNumber} and is now active.` });
      } else if (activateAfterSave && (!values.roomId || values.roomId === "null")) {
        toast({ title: "Activation Pending", description: "Please assign a room to activate this resident. Save again after assigning.", variant: "default" });
        // Don't navigate away, user needs to assign room
        fetchResidentAndRooms(); // Re-fetch to update form if needed
        return;
      }
      
      router.push('/dashboard/residents');
    } catch (error) {
       toast({ title: "Error", description: "Failed to update resident.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!editingResident) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/residents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Card>
          <CardHeader><CardTitle className="text-destructive">Resident not found</CardTitle></CardHeader>
          <CardContent><p>The resident you are trying to edit does not exist.</p></CardContent>
        </Card>
      </div>
    );
  }
  
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
          <UserCog className="mr-3 h-8 w-8 text-primary" />
          Edit Resident: {editingResident.name}
        </h1>
      </div>
      <ResidentForm
        onSubmit={handleEditResident}
        defaultValues={editingResident}
        isEditing={true}
        availableRooms={availableRooms}
        onCancel={() => router.push('/dashboard/residents')}
      />
    </div>
  );
}
