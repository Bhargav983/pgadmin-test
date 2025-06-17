
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getResidentColumns } from "./resident-columns";
import { ResidentForm } from "./resident-form";
import { PaymentForm } from "@/components/payment-form";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { TransferRoomDialog } from "./transfer-room-dialog"; // New Import
import type { Resident, ResidentFormValues, Room, Payment, PaymentFormValues as PaymentDataInput, ReceiptData } from "@/lib/types";
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
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse localStorage data for key:", key, e);
    return [];
  }
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

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedResidentForPayment, setSelectedResidentForPayment] = useState<Resident | null>(null);

  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentReceiptData, setCurrentReceiptData] = useState<ReceiptData | null>(null);

  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [residentToTransfer, setResidentToTransfer] = useState<Resident | null>(null);

  const [isVacateConfirmOpen, setIsVacateConfirmOpen] = useState(false);
  const [residentToVacate, setResidentToVacate] = useState<Resident | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(() => {
    let storedResidents = getStoredData<Resident>('pgResidents');
    const storedRooms = getStoredData<Room>('pgRooms');

    storedResidents = storedResidents.map(res => ({
      ...res,
      payments: Array.isArray(res.payments) ? res.payments.map(p => ({...p, receiptId: p.receiptId || '' })) : []
    }));

    const roomsWithOccupancy = storedRooms.map(room => ({
      ...room,
      currentOccupancy: storedResidents.filter(resident => resident.roomId === room.id).length
    }));
    
    setResidents(storedResidents);
    setRooms(roomsWithOccupancy);
    if (typeof window !== 'undefined') {
      setStoredData('pgRooms', roomsWithOccupancy); 
      setStoredData('pgResidents', storedResidents);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddResident = async (values: ResidentFormValues) => {
    try {
      const newResident: Resident = { 
        ...values, 
        id: crypto.randomUUID(),
        payments: [] 
      };
      const updatedResidents = [...residents, newResident];
      setStoredData('pgResidents', updatedResidents);
      fetchData(); 
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
        res.id === editingResident.id ? { ...res, ...values, payments: res.payments || [] } : res
      );
      setStoredData('pgResidents', updatedResidents);
      fetchData(); 
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
      fetchData(); 
      toast({ title: "Resident Deleted", description: "Resident has been successfully deleted.", variant: "default" });
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
    
    const roomForPayment = rooms.find(r => r.id === selectedResidentForPayment.roomId);
    if (!roomForPayment) {
        toast({ title: "Error", description: "Could not find room details for payment.", variant: "destructive" });
        return;
    }

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      receiptId: `RCPT-${crypto.randomUUID().substring(0,8).toUpperCase()}`,
      roomId: selectedResidentForPayment.roomId,
      ...paymentInput,
    };

    const updatedResidents = residents.map(res => {
      if (res.id === selectedResidentForPayment.id) {
        return {
          ...res,
          payments: [...(res.payments || []), newPayment]
        };
      }
      return res;
    });

    setStoredData('pgResidents', updatedResidents);
    fetchData();
    setIsPaymentFormOpen(false);
    
    setCurrentReceiptData({
        payment: newPayment,
        residentName: selectedResidentForPayment.name,
        roomNumber: roomForPayment.roomNumber,
        pgName: "PG Admin"
    });
    setIsReceiptDialogOpen(true);

    toast({ title: "Payment Recorded", description: `Payment for ${selectedResidentForPayment.name} recorded. Receipt generated.`, variant: "default" });
    setSelectedResidentForPayment(null);
  };

  const handleOpenTransferDialog = (resident: Resident) => {
    setResidentToTransfer(resident);
    setIsTransferDialogOpen(true);
  };

  const handleTransferResidentSubmit = (newRoomId: string) => {
    if (!residentToTransfer || !newRoomId) {
      toast({ title: "Error", description: "Invalid transfer details.", variant: "destructive" });
      return;
    }
    if (residentToTransfer.roomId === newRoomId) {
       toast({ title: "Info", description: "Resident is already in the selected room.", variant: "default" });
       setIsTransferDialogOpen(false);
       setResidentToTransfer(null);
       return;
    }

    try {
      const updatedResidents = residents.map(res => 
        res.id === residentToTransfer.id ? { ...res, roomId: newRoomId } : res
      );
      setStoredData('pgResidents', updatedResidents);
      fetchData();
      toast({ title: "Resident Transferred", description: `${residentToTransfer.name} has been transferred successfully.`, variant: "default"});
    } catch (error) {
      toast({ title: "Error", description: "Failed to transfer resident.", variant: "destructive" });
    } finally {
      setIsTransferDialogOpen(false);
      setResidentToTransfer(null);
    }
  };

  const handleOpenVacateDialog = (resident: Resident) => {
    setResidentToVacate(resident);
    setIsVacateConfirmOpen(true);
  };

  const executeVacateResident = () => {
    if (!residentToVacate) return;
    try {
      const updatedResidents = residents.map(res => 
        res.id === residentToVacate.id ? { ...res, roomId: null } : res
      );
      setStoredData('pgResidents', updatedResidents);
      fetchData();
      toast({ title: "Resident Vacated", description: `${residentToVacate.name} has been vacated from their room.`, variant: "default"});
    } catch (error) {
      toast({ title: "Error", description: "Failed to vacate resident.", variant: "destructive" });
    } finally {
      setIsVacateConfirmOpen(false);
      setResidentToVacate(null);
    }
  };


  const columns = getResidentColumns(
    rooms, 
    openEditForm, 
    handleDeleteConfirmation, 
    openPaymentForm,
    handleOpenTransferDialog, // New
    handleOpenVacateDialog    // New
  );
  
  const currentRoomForPayment = selectedResidentForPayment ? rooms.find(r => r.id === selectedResidentForPayment.roomId) : null;


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

      {selectedResidentForPayment && currentRoomForPayment && (
        <PaymentForm
          isOpen={isPaymentFormOpen}
          onClose={() => { setIsPaymentFormOpen(false); setSelectedResidentForPayment(null); }}
          onSubmit={handleSavePayment}
          residentName={selectedResidentForPayment.name}
          defaultRentAmount={currentRoomForPayment.rent}
        />
      )}

      {currentReceiptData && (
        <ReceiptDialog
            isOpen={isReceiptDialogOpen}
            onClose={() => setIsReceiptDialogOpen(false)}
            receiptData={currentReceiptData}
        />
      )}

      {residentToTransfer && (
        <TransferRoomDialog
          isOpen={isTransferDialogOpen}
          onClose={() => { setIsTransferDialogOpen(false); setResidentToTransfer(null); }}
          onSubmit={handleTransferResidentSubmit}
          residentName={residentToTransfer.name}
          currentRoomId={residentToTransfer.roomId}
          availableRooms={rooms.filter(room => room.id !== residentToTransfer.roomId)} // Pass rooms excluding current
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this resident?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the resident's record, including all payment history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResidentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteResident} className="bg-destructive hover:bg-destructive/90">
              Delete Resident
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isVacateConfirmOpen} onOpenChange={setIsVacateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to vacate this resident?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unassign the resident from their current room. Their record will remain, but they will not be associated with any room.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResidentToVacate(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeVacateResident} className="bg-orange-500 hover:bg-orange-600">
              Vacate Resident
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
