
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getActiveResidentColumns, getUpcomingResidentColumns, getFormerResidentColumns } from "./resident-columns";
import { ResidentForm } from "./resident-form";
import { PaymentForm } from "@/components/payment-form";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { TransferRoomDialog } from "./transfer-room-dialog";
import type { Resident, ResidentFormValues, Room, Payment, PaymentFormValues as PaymentDataInput, ReceiptData, ResidentStatus, ActivityLogEntry, ActivityType } from "@/lib/types";
import { PlusCircle, UserCheck, UserX, RotateCcw } from "lucide-react";
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
import { format } from "date-fns";

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

export default function ResidentsPage() {
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [currentResidents, setCurrentResidents] = useState<Resident[]>([]);
  const [upcomingResidents, setUpcomingResidents] = useState<Resident[]>([]);
  const [formerResidents, setFormerResidents] = useState<Resident[]>([]);
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | undefined>(undefined);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState<string | null>(null);

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedResidentForPayment, setSelectedResidentForPayment] = useState<Resident | null>(null);

  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState<ReceiptData | null>(null);

  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [residentToTransfer, setResidentToTransfer] = useState<Resident | null>(null);

  const [isVacateConfirmOpen, setIsVacateConfirmOpen] = useState(false);
  const [residentToVacate, setResidentToVacate] = useState<Resident | null>(null);
  
  const [isActivateConfirmOpen, setIsActivateConfirmOpen] = useState(false);
  const [residentToActivate, setResidentToActivate] = useState<Resident | null>(null);

  const [isReactivateConfirmOpen, setIsReactivateConfirmOpen] = useState(false);
  const [residentToReactivate, setResidentToReactivate] = useState<Resident | null>(null);

  const [isAssigningRoomForActivation, setIsAssigningRoomForActivation] = useState(false);

  const { toast } = useToast();

  const addActivityLogEntry = (
    residentId: string,
    type: ActivityType,
    description: string,
    details?: Record<string, any>
  ): Promise<Resident[]> => {
    return new Promise((resolve) => {
      setAllResidents(prevAllResidents => {
        const updatedResidents = prevAllResidents.map(res => {
          if (res.id === residentId) {
            const newLogEntry: ActivityLogEntry = {
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
        resolve(updatedResidents);
        return updatedResidents; 
      });
    });
  };


  const fetchData = useCallback(() => {
    let storedResidents = getStoredData<Resident>('pgResidents');
    const storedRooms = getStoredData<Room>('pgRooms');
    setRooms(storedRooms); // Save original rooms data

    storedResidents = storedResidents.map(res => ({
      ...res,
      status: res.status || 'active', 
      payments: Array.isArray(res.payments) ? res.payments.map(p => ({...p, receiptId: p.receiptId || '' })) : [],
      activityLog: Array.isArray(res.activityLog) ? res.activityLog : [],
      enquiryDate: res.enquiryDate || null,
      joiningDate: res.joiningDate || null,
    }));
    setAllResidents(storedResidents);
    setCurrentResidents(storedResidents.filter(res => res.status === 'active'));
    setUpcomingResidents(storedResidents.filter(res => res.status === 'upcoming'));
    setFormerResidents(storedResidents.filter(res => res.status === 'former'));

    const roomsWithOccupancy = storedRooms.map(room => ({
      ...room,
      currentOccupancy: storedResidents.filter(resident => resident.roomId === room.id && (resident.status === 'active' || resident.status === 'upcoming')).length
    }));
    
    // It's important to setRooms with occupancy for UI components that need it, like ResidentForm.
    // However, ensure that the version of rooms stored in localStorage does not have this derived property if it's not part of the core Room type.
    // For now, it seems the Room type in types.ts includes currentOccupancy, so this is fine.
    // If Room type was just id, roomNumber, capacity, rent, then we'd store storedRooms, not roomsWithOccupancy.
    setRooms(roomsWithOccupancy); 
    if (typeof window !== 'undefined') {
      // Assuming 'pgRooms' in localStorage should reflect the base room data + dynamic occupancy for UI convenience.
      setStoredData('pgRooms', roomsWithOccupancy); 
    }
  }, []);

  useEffect(() => {
    fetchData();
    const handleStorageChange = () => fetchData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchData]);

  const handleFormSubmit = async (values: ResidentFormValues) => {
    try {
      let updatedResidents;
      let residentIdForAction: string | undefined = editingResident?.id;
      const localRooms = getStoredData<Room>('pgRooms'); // Fetch fresh rooms data for descriptions
      const roomNumber = values.roomId ? localRooms.find(r=>r.id === values.roomId)?.roomNumber : 'Unassigned';

      if (editingResident) {
        const oldResident = allResidents.find(res => res.id === editingResident.id);
        updatedResidents = allResidents.map((res) =>
          res.id === editingResident.id ? { 
            ...res, 
            ...values, 
            roomId: values.roomId === "null" ? null : values.roomId, 
            payments: res.payments || [],
            activityLog: res.activityLog || [] 
          } : res
        );
        setStoredData('pgResidents', updatedResidents);
        
        let updateDescription = `Details updated for ${values.name}.`;
        if (oldResident?.roomId !== values.roomId && !(values.status === 'former' && !values.roomId)) { // room changed and not due to becoming former
           updateDescription += ` Room changed from ${localRooms.find(r=>r.id === oldResident?.roomId)?.roomNumber || 'Unassigned'} to ${roomNumber || 'Unassigned'}.`;
           await addActivityLogEntry(editingResident.id, 'ROOM_ASSIGNED', `Assigned to room: ${roomNumber || 'Unassigned'}.`, { oldRoomId: oldResident?.roomId, newRoomId: values.roomId });
        }
        if (oldResident?.status !== values.status) {
          updateDescription += ` Status changed from ${oldResident?.status} to ${values.status}.`;
        }
        await addActivityLogEntry(editingResident.id, 'DETAILS_UPDATED', updateDescription, { oldValues: oldResident, newValues: values });
        
        toast({ title: "Resident Updated", description: `${values.name} has been updated.`, variant: "default" });
      } else {
        const newResidentId = crypto.randomUUID();
        residentIdForAction = newResidentId;
        const newResident: Resident = { 
          ...values, 
          id: newResidentId,
          payments: [],
          activityLog: [], 
          roomId: values.roomId === "null" ? null : values.roomId,
          status: values.status || 'upcoming', 
        };
        updatedResidents = [...allResidents, newResident];
        setStoredData('pgResidents', updatedResidents); // Save first, then add log
        await addActivityLogEntry(newResidentId, 'RESIDENT_CREATED', `Resident record created for ${values.name}. Status: ${values.status}. Room: ${roomNumber}.`, { ...values, roomNumber });
        toast({ title: "Resident Added", description: `${newResident.name} has been added as ${values.status}.`, variant: "default" });
      }
      
      if (isAssigningRoomForActivation && residentIdForAction) {
        const residentJustSaved = updatedResidents.find(res => res.id === residentIdForAction);
        if (residentJustSaved && values.roomId && values.roomId !== "null") {
            const finalUpdatedResidents = updatedResidents.map(res => 
                res.id === residentJustSaved.id ? { ...res, status: 'active' as ResidentStatus } : res
            );
            setStoredData('pgResidents', finalUpdatedResidents);
            await addActivityLogEntry(residentIdForAction, 'ACTIVATED', `${residentJustSaved.name} activated and assigned to room ${roomNumber}.`, { roomId: values.roomId, roomNumber });
            fetchData();
            toast({ title: "Resident Activated", description: `${residentJustSaved.name} assigned room ${roomNumber} and is now active.` });
            setIsFormOpen(false);
            setEditingResident(undefined);
            setIsAssigningRoomForActivation(false);
            return; 
        } else if (residentJustSaved && (!values.roomId || values.roomId === "null")) {
            toast({ title: "Activation Pending", description: "Please assign a room to activate this resident.", variant: "destructive" });
            fetchData(); 
            return; 
        }
      }
      
      fetchData(); 
      setIsFormOpen(false);
      setEditingResident(undefined);
      setIsAssigningRoomForActivation(false); 
    } catch (error) {
       toast({ title: "Error", description: "Failed to save resident.", variant: "destructive" });
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
      // Note: Deleting a resident means their activity log is also gone.
      // If soft delete or archiving is needed, this logic would change.
      const updatedResidents = allResidents.filter((res) => res.id !== residentToDelete);
      setStoredData('pgResidents', updatedResidents);
      fetchData(); 
      toast({ title: "Resident Deleted", description: "Resident record has been permanently deleted.", variant: "default" });
    } catch (error) {
       toast({ title: "Error", description: "Failed to delete resident.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setResidentToDelete(null);
    }
  };

  const openPaymentForm = (resident: Resident) => {
    setSelectedResidentForPayment(resident);
    setIsPaymentFormOpen(true);
  };

  const handleSavePayment = async (paymentInput: PaymentDataInput) => {
    if (!selectedResidentForPayment || !selectedResidentForPayment.roomId) {
      toast({ title: "Error", description: "No resident or room selected for payment.", variant: "destructive" });
      return;
    }
    const localRooms = getStoredData<Room>('pgRooms');
    const roomForPayment = localRooms.find(r => r.id === selectedResidentForPayment.roomId);
    if (!roomForPayment) {
        toast({ title: "Error", description: "Could not find room details for payment.", variant: "destructive" });
        return;
    }
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      receiptId: `RCPT-${crypto.randomUUID().substring(0,8).toUpperCase()}`,
      roomId: selectedResidentForPayment.roomId, // Log the room ID at the time of payment
       ...paymentInput,
    };
    
    let updatedResidents = allResidents.map(res => 
      res.id === selectedResidentForPayment.id ? { ...res, payments: [...(res.payments || []), newPayment] } : res
    );
    setStoredData('pgResidents', updatedResidents); // Save payment first
    
    const paymentDescription = `Payment of ₹${newPayment.amount.toLocaleString()} via ${newPayment.mode} for ${format(new Date(newPayment.year, newPayment.month - 1), 'MMMM yyyy')} recorded. Room: ${roomForPayment.roomNumber}.`;
    await addActivityLogEntry(selectedResidentForPayment.id, 'PAYMENT_RECORDED', paymentDescription, { paymentId: newPayment.id, amount: newPayment.amount, roomNumber: roomForPayment.roomNumber });
    
    fetchData(); // Then fetch updated data with log
    setIsPaymentFormOpen(false);
    setCurrentReceiptData({ payment: newPayment, residentName: selectedResidentForPayment.name, roomNumber: roomForPayment.roomNumber, pgName: "PG Admin"});
    setIsReceiptDialogOpen(true);
    toast({ title: "Payment Recorded", description: `Payment for ${selectedResidentForPayment.name} recorded.`, variant: "default" });
    setSelectedResidentForPayment(null);
  };

  const handleOpenTransferDialog = (resident: Resident) => {
    setResidentToTransfer(resident);
    setIsTransferDialogOpen(true);
  };

  const handleTransferResidentSubmit = async (newRoomId: string) => {
    if (!residentToTransfer || !residentToTransfer.roomId) return; // Must have a current room to transfer from
    
    const targetRoomId = newRoomId === "null" ? null : newRoomId; // This case should ideally not happen if dialog logic is correct
    if (residentToTransfer.roomId === targetRoomId) {
       toast({ title: "Info", description: "Resident is already in the selected room.", variant: "default" });
       setIsTransferDialogOpen(false); setResidentToTransfer(null); return;
    }
    if (!targetRoomId) {
        toast({ title: "Error", description: "Target room for transfer cannot be 'Unassigned' through this action.", variant: "destructive" });
        return;
    }

    try {
      const localRooms = getStoredData<Room>('pgRooms');
      const fromRoomNumber = localRooms.find(r => r.id === residentToTransfer.roomId)?.roomNumber || 'Unknown';
      const toRoomNumber = localRooms.find(r => r.id === targetRoomId)?.roomNumber || 'Unknown';

      const updatedResidents = allResidents.map(res => 
        res.id === residentToTransfer.id ? { ...res, roomId: targetRoomId } : res
      );
      setStoredData('pgResidents', updatedResidents);
      await addActivityLogEntry(residentToTransfer.id, 'ROOM_TRANSFERRED', `Transferred from room ${fromRoomNumber} to room ${toRoomNumber}.`, { fromRoomId: residentToTransfer.roomId, toRoomId: targetRoomId, fromRoomNumber, toRoomNumber });
      fetchData();
      toast({ title: "Resident Transferred", description: `${residentToTransfer.name} has been transferred to room ${toRoomNumber}.`, variant: "default"});
    } catch (error) { toast({ title: "Error", description: "Failed to transfer resident.", variant: "destructive" });
    } finally { setIsTransferDialogOpen(false); setResidentToTransfer(null); }
  };
  
  const handleOpenVacateDialog = (resident: Resident) => {
    setResidentToVacate(resident);
    setIsVacateConfirmOpen(true);
  };

  const executeVacateResident = async () => {
    if (!residentToVacate) return;
    try {
      const localRooms = getStoredData<Room>('pgRooms');
      const vacatedFromRoomNumber = residentToVacate.roomId ? localRooms.find(r => r.id === residentToVacate.roomId)?.roomNumber : 'N/A';
      
      const updatedResidents = allResidents.map(res => 
        res.id === residentToVacate.id ? { ...res, status: 'former' as ResidentStatus, roomId: null } : res
      );
      setStoredData('pgResidents', updatedResidents);
      await addActivityLogEntry(residentToVacate.id, 'VACATED', `${residentToVacate.name} vacated from room ${vacatedFromRoomNumber}. Status changed to Former.`, { vacatedFromRoomId: residentToVacate.roomId, vacatedFromRoomNumber });
      fetchData();
      toast({ title: "Resident Vacated", description: `${residentToVacate.name} has been set to 'Former' and unassigned from room.`, variant: "default"});
    } catch (error) { toast({ title: "Error", description: "Failed to vacate resident.", variant: "destructive" });
    } finally { setIsVacateConfirmOpen(false); setResidentToVacate(null); }
  };

  const handleOpenActivateDialog = (resident: Resident) => {
    if (!resident.roomId) {
      setEditingResident(resident);
      setIsAssigningRoomForActivation(true);
      setIsFormOpen(true);
      toast({ title: "Assign Room to Activate", description: `Please assign a room to ${resident.name} to activate them.`, variant: "default"});
      return;
    }
    setResidentToActivate(resident);
    setIsActivateConfirmOpen(true);
  };

  const executeActivateResident = async () => {
    if (!residentToActivate) return;
    try {
      const localRooms = getStoredData<Room>('pgRooms');
      const roomNumber = residentToActivate.roomId ? localRooms.find(r => r.id === residentToActivate.roomId)?.roomNumber : 'N/A';

      const updatedResidents = allResidents.map(res => 
        res.id === residentToActivate.id ? { ...res, status: 'active' as ResidentStatus } : res
      );
      setStoredData('pgResidents', updatedResidents);
      await addActivityLogEntry(residentToActivate.id, 'ACTIVATED', `${residentToActivate.name} activated. Current room: ${roomNumber}.`, { roomId: residentToActivate.roomId, roomNumber });
      fetchData();
      toast({ title: "Resident Activated", description: `${residentToActivate.name} is now active in room ${roomNumber}.`, variant: "default"});
    } catch (error) { toast({ title: "Error", description: "Failed to activate resident.", variant: "destructive" });
    } finally { setIsActivateConfirmOpen(false); setResidentToActivate(null); }
  };

  const handleOpenReactivateDialog = (resident: Resident) => {
    setResidentToReactivate(resident);
    setIsReactivateConfirmOpen(true);
  };

  const executeReactivateResident = async () => {
    if (!residentToReactivate) return;
    try {
      const updatedResidents = allResidents.map(res => 
        res.id === residentToReactivate.id ? { ...res, status: 'upcoming' as ResidentStatus, roomId: null } : res 
      );
      setStoredData('pgResidents', updatedResidents);
      await addActivityLogEntry(residentToReactivate.id, 'REACTIVATED', `${residentToReactivate.name} reactivated. Status changed to Upcoming and unassigned from any room.`);
      fetchData();
      toast({ title: "Resident Reactivated", description: `${residentToReactivate.name} is now 'Upcoming'. Assign a room and activate if needed.`, variant: "default"});
    } catch (error) { toast({ title: "Error", description: "Failed to reactivate resident.", variant: "destructive" });
    } finally { setIsReactivateConfirmOpen(false); setResidentToReactivate(null); }
  };

  const activeColumns = getActiveResidentColumns(rooms, openEditForm, handleDeleteConfirmation, openPaymentForm, handleOpenTransferDialog, handleOpenVacateDialog);
  const upcomingColumns = getUpcomingResidentColumns(rooms, openEditForm, handleDeleteConfirmation, handleOpenActivateDialog);
  const formerColumns = getFormerResidentColumns(openEditForm, handleDeleteConfirmation, handleOpenReactivateDialog);
  
  const currentRoomForPayment = selectedResidentForPayment ? rooms.find(r => r.id === selectedResidentForPayment.roomId) : null;

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-headline font-semibold">Manage Residents</h1>
        <Button onClick={() => { setEditingResident(undefined); setIsFormOpen(true); setIsAssigningRoomForActivation(false); }} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Resident
        </Button>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current ({currentResidents.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingResidents.length})</TabsTrigger>
          <TabsTrigger value="former">Former ({formerResidents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="current">
          <DataTable columns={activeColumns} data={currentResidents} filterColumn="name" filterInputPlaceholder="Filter current residents..." />
        </TabsContent>
        <TabsContent value="upcoming">
          <DataTable columns={upcomingColumns} data={upcomingResidents} filterColumn="name" filterInputPlaceholder="Filter upcoming residents..." />
        </TabsContent>
        <TabsContent value="former">
          <DataTable columns={formerColumns} data={formerResidents} filterColumn="name" filterInputPlaceholder="Filter former residents..." />
        </TabsContent>
      </Tabs>

      <ResidentForm
        isOpen={isFormOpen}
        onClose={() => {setIsFormOpen(false); setEditingResident(undefined); setIsAssigningRoomForActivation(false);}}
        onSubmit={handleFormSubmit}
        defaultValues={editingResident} 
        isEditing={!!editingResident}
        availableRooms={rooms}
      />

      {selectedResidentForPayment && currentRoomForPayment && (
        <PaymentForm isOpen={isPaymentFormOpen} onClose={() => { setIsPaymentFormOpen(false); setSelectedResidentForPayment(null); }}
          onSubmit={handleSavePayment} residentName={selectedResidentForPayment.name} defaultRentAmount={currentRoomForPayment.rent} />
      )}
      {currentReceiptData && (<ReceiptDialog isOpen={isReceiptDialogOpen} onClose={() => setIsReceiptDialogOpen(false)} receiptData={currentReceiptData} /> )}
      {residentToTransfer && (
        <TransferRoomDialog isOpen={isTransferDialogOpen} onClose={() => { setIsTransferDialogOpen(false); setResidentToTransfer(null); }}
          onSubmit={handleTransferResidentSubmit} residentName={residentToTransfer.name} currentRoomId={residentToTransfer.roomId}
          availableRooms={rooms.filter(room => room.id !== residentToTransfer.roomId)} />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Resident?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone and will permanently delete the resident's record, including all payment and activity history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setResidentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteResident} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isVacateConfirmOpen} onOpenChange={setIsVacateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Vacate Resident: {residentToVacate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will change their status to 'Former' and unassign them from their room. Their record and activity log will remain.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setResidentToVacate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeVacateResident} className="bg-orange-500 hover:bg-orange-600"><UserX className="mr-2 h-4 w-4"/>Vacate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isActivateConfirmOpen} onOpenChange={setIsActivateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Activate Resident: {residentToActivate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will change their status to 'Active'. They must be assigned to a room. They will then be included in active billing.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setResidentToActivate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeActivateResident} className="bg-green-600 hover:bg-green-700"><UserCheck className="mr-2 h-4 w-4"/>Activate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isReactivateConfirmOpen} onOpenChange={setIsReactivateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Reactivate Resident: {residentToReactivate?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will change their status to 'Upcoming' and unassign them from any previous room. You can then assign a new room and activate them.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setResidentToReactivate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeReactivateResident} className="bg-blue-600 hover:bg-blue-700"><RotateCcw className="mr-2 h-4 w-4"/>Reactivate to Upcoming</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
