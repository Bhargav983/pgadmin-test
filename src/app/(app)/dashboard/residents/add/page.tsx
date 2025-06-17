
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation"; 
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
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [initialFormValues, setInitialFormValues] = useState<Partial<ResidentFormValues>>({});

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

    // Prepare initial values from query parameters (enquiry conversion or direct room assignment)
    const defaultVals: Partial<ResidentFormValues> = {
        status: 'upcoming', // Default status for new residents
    };
    const nameFromQuery = searchParams.get('name');
    const contactFromQuery = searchParams.get('contact');
    const emailFromQuery = searchParams.get('email');
    const enquiryDateFromQuery = searchParams.get('enquiryDate');
    const convertedFromEnquiryId = searchParams.get('convertedFromEnquiryId'); // Store for logging

    if (nameFromQuery) defaultVals.name = nameFromQuery;
    if (contactFromQuery) defaultVals.contact = contactFromQuery;
    if (emailFromQuery) defaultVals.email = emailFromQuery;
    if (enquiryDateFromQuery) defaultVals.enquiryDate = enquiryDateFromQuery;
    // roomId and floorNumber are handled by separate props for ResidentForm for now
    
    setInitialFormValues(defaultVals);

  }, [fetchRooms, searchParams]);


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
        roomId: values.roomId,
        status: values.status || 'upcoming', // Ensure status is set
        photoUrl: values.photoUrl || null,
        idProofUrl: values.idProofUrl || null,
        guardianName: values.guardianName || null,
        guardianContact: values.guardianContact || null,
      };

      let updatedResidents = [...allResidents, newResident];
      setStoredData('pgResidents', updatedResidents);

      const roomNumber = values.roomId ? availableRooms.find(r=>r.id === values.roomId)?.roomNumber : 'Unassigned';
      let creationDescription = `Resident record created for ${values.name}. Status: ${newResident.status}. Room: ${roomNumber}.`;
      
      const convertedFromEnquiryId = searchParams.get('convertedFromEnquiryId');
      if (convertedFromEnquiryId) {
        creationDescription += ` Converted from enquiry ID: ${convertedFromEnquiryId.substring(0,8)}.`;
         updatedResidents = await addActivityLogEntry(updatedResidents, newResidentId, 'ENQUIRY_CONVERTED', `Converted from enquiry. Original Enquiry ID: ${convertedFromEnquiryId}`, { enquiryId: convertedFromEnquiryId });
      }
      
      updatedResidents = await addActivityLogEntry(updatedResidents, newResidentId, 'RESIDENT_CREATED', creationDescription, { ...values, roomNumber });
      
      if(values.roomId && (newResident.status === 'active' || newResident.status === 'upcoming')){
         updatedResidents = await addActivityLogEntry(updatedResidents, newResidentId, 'ROOM_ASSIGNED', `Assigned to room: ${roomNumber}.`, { newRoomId: values.roomId, newRoomNumber: roomNumber });
      }

      toast({ title: "Resident Added", description: `${newResident.name} has been added as ${newResident.status}.`, variant: "default" });
      router.push('/dashboard/residents');
    } catch (error) {
       toast({ title: "Error", description: "Failed to add resident.", variant: "destructive" });
    }
  };
  
  // Read initial room and floor from query params for direct add from room card
  const initialRoomIdFromQuery = searchParams.get('roomId');
  const initialFloorNumberFromQuery = searchParams.get('floorNumber');

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
        defaultValues={initialFormValues} // Pass combined initial values
        initialRoomId={initialRoomIdFromQuery} // For pre-selecting room from room card
        initialFloorNumber={initialFloorNumberFromQuery} // For pre-selecting floor from room card
      />
    </div>
  );
}
