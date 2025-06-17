
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getActiveResidentColumns, getUpcomingResidentColumns, getFormerResidentColumns } from "./resident-columns";
import { PaymentForm } from "@/components/payment-form";
import { ReceiptDialog } from "@/components/receipt-dialog";
import { TransferRoomDialog } from "./transfer-room-dialog";
import type { Resident, Room, Payment, PaymentFormValues as PaymentDataInput, ReceiptData, ResidentStatus, ActivityLogEntry, ActivityType } from "@/lib/types";
import { PlusCircle, UserCheck, UserX, RotateCcw, List, LayoutGrid } from "lucide-react"; // Added List, LayoutGrid
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
import { Input } from "@/components/ui/input"; // Added Input
import { ResidentCard } from "@/components/resident-card"; // Added ResidentCard

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
  const router = useRouter();
  const [allResidents, setAllResidents] = useState<Resident[]>([]);
  const [currentResidents, setCurrentResidents] = useState<Resident[]>([]);
  const [upcomingResidents, setUpcomingResidents] = useState<Resident[]>([]);
  const [formerResidents, setFormerResidents] = useState<Resident[]>([]);
  
  const [rooms, setRooms] = useState<Room[]>([]);
    
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

  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState('current');


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
    setRooms(storedRooms); 

    storedResidents = storedResidents.map(res => ({
      ...res,
      status: res.status || 'active', 
      payments: Array.isArray(res.payments) ? res.payments.map(p => ({...p, receiptId: p.receiptId || '' })) : [],
      activityLog: Array.isArray(res.activityLog) ? res.activityLog : [],
      enquiryDate: res.enquiryDate || null,
      joiningDate: res.joiningDate || null,
      photoUrl: res.photoUrl || null,
      idProofUrl: res.idProofUrl || null,
      guardianName: res.guardianName || null,
      guardianContact: res.guardianContact || null,
    }));
    setAllResidents(storedResidents);

    // Apply search term filter
    const filteredByName = searchTerm
      ? storedResidents.filter(res => res.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : storedResidents;
    
    setCurrentResidents(filteredByName.filter(res => res.status === 'active').sort((a,b) => a.name.localeCompare(b.name)));
    setUpcomingResidents(filteredByName.filter(res => res.status === 'upcoming').sort((a,b) => a.name.localeCompare(b.name)));
    setFormerResidents(filteredByName.filter(res => res.status === 'former').sort((a,b) => a.name.localeCompare(b.name)));

    const roomsWithOccupancy = storedRooms.map(room => ({
      ...room,
      currentOccupancy: storedResidents.filter(resident => resident.roomId === room.id && (resident.status === 'active' || resident.status === 'upcoming')).length
    }));
    
    setRooms(roomsWithOccupancy); 
    if (typeof window !== 'undefined') {
      setStoredData('pgRooms', roomsWithOccupancy); 
    }
  }, [searchTerm]); // Add searchTerm to dependencies

  useEffect(() => {
    fetchData();
    const handleStorageChange = () => fetchData();
    window.addEventListener('storage', handleStorageChange);

    const handleDataChangedEvent = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.storeKey === 'pgResidents' || customEvent.detail?.storeKey === 'pgRooms') {
            fetchData();
        }
    };
    window.addEventListener('dataChanged', handleDataChangedEvent);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('dataChanged', handleDataChangedEvent);
    };
  }, [fetchData]);


  const handleNavigateToEdit = (residentId: string) => {
    router.push(`/dashboard/residents/${residentId}/edit`);
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
    
    const currentAllResidents = getStoredData<Resident>('pgResidents');
    const residentData = currentAllResidents.find(r => r.id === selectedResidentForPayment.id);

    if (!residentData || !residentData.roomId) {
        toast({ title: "Error", description: "Could not find resident data or resident is not assigned to a room.", variant: "destructive" });
        return;
    }
    
    const localRooms = getStoredData<Room>('pgRooms');
    const roomForPayment = localRooms.find(r => r.id === residentData.roomId);

    if (!roomForPayment || roomForPayment.rent <= 0) {
        toast({ title: "Error", description: "Resident's assigned room has no rent configured or rent is zero.", variant: "destructive" });
        return;
    }

    const targetMonth = paymentInput.month;
    const targetYear = paymentInput.year;
    const roomRent = roomForPayment.rent;

    const amountAlreadyPaidForTargetPeriod = (residentData.payments || [])
      .filter(p => p.month === targetMonth && p.year === targetYear && p.roomId === roomForPayment.id)
      .reduce((sum, p) => sum + p.amount, 0);

    let actualPreviousBalance = 0;
    const residentJoiningYear = residentData.joiningDate ? new Date(residentData.joiningDate).getFullYear() : targetYear -1;
    const residentJoiningMonth = residentData.joiningDate ? new Date(residentData.joiningDate).getMonth() + 1 : 1;

    for (let y = residentJoiningYear; y <= targetYear; y++) {
      const monthStart = (y === residentJoiningYear) ? residentJoiningMonth : 1;
      const monthEnd = (y < targetYear) ? 12 : targetMonth - 1;

      for (let m = monthStart; m <= monthEnd; m++) {
        const pastRoomId = residentData.roomId; 
        const pastRoom = localRooms.find(r => r.id === pastRoomId);
        if (!pastRoom || pastRoom.rent <= 0) continue;

        const rentForPastMonth = pastRoom.rent;
        const paymentsForPastMonth = (residentData.payments || []).filter(p => p.month === m && p.year === y && p.roomId === pastRoom.id);
        const amountPaidPastMonth = paymentsForPastMonth.reduce((sum, p) => sum + p.amount, 0);
        
        if (amountPaidPastMonth < rentForPastMonth) {
          actualPreviousBalance += (rentForPastMonth - amountPaidPastMonth);
        }
      }
    }
    
    const isTargetPeriodFullyCoveredByExistingPayments = (amountAlreadyPaidForTargetPeriod >= roomRent);
    const canProceedWithPayment = !isTargetPeriodFullyCoveredByExistingPayments || actualPreviousBalance > 0;

    if (!canProceedWithPayment) {
      toast({
        title: "Payment Not Allowed",
        description: `Payment for ${format(new Date(targetYear, targetMonth -1), 'MMMM yyyy')} is already settled for ${residentData.name}, and there are no previous dues.`,
        variant: "destructive",
      });
      return;
    }

    const newPayment: Payment = {
      id: crypto.randomUUID(),
      receiptId: `RCPT-${crypto.randomUUID().substring(0,8).toUpperCase()}`,
      roomId: residentData.roomId, 
       ...paymentInput,
    };
    
    const updatedResidentsWithPayment = currentAllResidents.map(res => 
      res.id === selectedResidentForPayment.id ? { ...res, payments: [...(res.payments || []), newPayment] } : res
    );
    setStoredData('pgResidents', updatedResidentsWithPayment); 
    
    const paymentDescription = `Payment of ₹${newPayment.amount.toLocaleString()} via ${newPayment.mode} for ${format(new Date(newPayment.year, newPayment.month - 1), 'MMMM yyyy')} recorded. Room: ${roomForPayment.roomNumber}.`;
    await addActivityLogEntry(selectedResidentForPayment.id, 'PAYMENT_RECORDED', paymentDescription, { paymentId: newPayment.id, amount: newPayment.amount, roomNumber: roomForPayment.roomNumber });
    
    fetchData(); 

    setIsPaymentFormOpen(false);
    setCurrentReceiptData({ payment: newPayment, residentName: selectedResidentForPayment.name, roomNumber: roomForPayment.roomNumber, pgName: "PG Admin"});
    setIsReceiptDialogOpen(true);
    toast({ title: "Payment Recorded", description: `Payment for ${selectedResidentForPayment.name} recorded.`, variant: "default" });
    setSelectedResidentForPayment(null);

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('dataChanged', { detail: { storeKey: 'pgResidents' } }));
    }
  };

  const handleOpenTransferDialog = (resident: Resident) => {
    setResidentToTransfer(resident);
    setIsTransferDialogOpen(true);
  };

  const handleTransferResidentSubmit = async (newRoomId: string) => {
    if (!residentToTransfer || !residentToTransfer.roomId) return; 
    
    const targetRoomId = newRoomId === "null" ? null : newRoomId; 
    if (residentToTransfer.roomId === targetRoomId) {
       toast({ title: "Info", description: "Resident is already in the selected room.", variant: "default" });
       setIsTransferDialogOpen(false); setResidentToTransfer(null); return;
    }
    if (!targetRoomId) {
        toast({ title: "Error", description: "Target room for transfer cannot be 'Unassigned' through this action.", variant: "destructive" });
        return;
    }

    try {
      const localRoomsData = getStoredData<Room>('pgRooms');
      const fromRoomNumber = localRoomsData.find(r => r.id === residentToTransfer.roomId)?.roomNumber || 'Unknown';
      const toRoomNumber = localRoomsData.find(r => r.id === targetRoomId)?.roomNumber || 'Unknown';

      const currentAllResidents = getStoredData<Resident>('pgResidents');
      const updatedResidents = currentAllResidents.map(res => 
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
      const localRoomsData = getStoredData<Room>('pgRooms');
      const vacatedFromRoomNumber = residentToVacate.roomId ? localRoomsData.find(r => r.id === residentToVacate.roomId)?.roomNumber : 'N/A';
      
      const currentAllResidents = getStoredData<Resident>('pgResidents');
      const updatedResidents = currentAllResidents.map(res => 
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
      router.push(`/dashboard/residents/${resident.id}/edit?activate=true`);
      toast({ title: "Assign Room to Activate", description: `Please assign a room to ${resident.name} to activate them.`, variant: "default"});
      return;
    }
    setResidentToActivate(resident);
    setIsActivateConfirmOpen(true);
  };

  const executeActivateResident = async () => {
    if (!residentToActivate) return;
    try {
      const localRoomsData = getStoredData<Room>('pgRooms');
      const roomNumber = residentToActivate.roomId ? localRoomsData.find(r => r.id === residentToActivate.roomId)?.roomNumber : 'N/A';

      const currentAllResidents = getStoredData<Resident>('pgResidents');
      const updatedResidents = currentAllResidents.map(res => 
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
      const currentAllResidents = getStoredData<Resident>('pgResidents');
      const updatedResidents = currentAllResidents.map(res => 
        res.id === residentToReactivate.id ? { ...res, status: 'upcoming' as ResidentStatus, roomId: null } : res 
      );
      setStoredData('pgResidents', updatedResidents); 
      await addActivityLogEntry(residentToReactivate.id, 'REACTIVATED', `${residentToReactivate.name} reactivated. Status changed to Upcoming and unassigned from any room.`);
      fetchData();
      toast({ title: "Resident Reactivated", description: `${residentToReactivate.name} is now 'Upcoming'. Assign a room and activate if needed.`, variant: "default"});
    } catch (error) { toast({ title: "Error", description: "Failed to reactivate resident.", variant: "destructive" });
    } finally { setIsReactivateConfirmOpen(false); setResidentToReactivate(null); }
  };

  const activeColumns = getActiveResidentColumns(rooms, handleNavigateToEdit, handleDeleteConfirmation, openPaymentForm, handleOpenTransferDialog, handleOpenVacateDialog);
  const upcomingColumns = getUpcomingResidentColumns(rooms, handleNavigateToEdit, handleDeleteConfirmation, handleOpenActivateDialog);
  const formerColumns = getFormerResidentColumns(handleNavigateToEdit, handleDeleteConfirmation, handleOpenReactivateDialog);
  
  const currentRoomForPayment = selectedResidentForPayment ? rooms.find(r => r.id === selectedResidentForPayment.roomId) : null;

  const displayedResidents = activeTab === 'current' ? currentResidents : activeTab === 'upcoming' ? upcomingResidents : formerResidents;

  return (
    <div className="container mx-auto py-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-headline font-semibold">Manage Residents</h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Input 
            placeholder="Search residents by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs w-full sm:w-auto"
          />
          <Button variant={viewMode === 'table' ? 'secondary' : 'outline'} size="icon" onClick={() => setViewMode('table')} aria-label="Table View">
            <List className="h-5 w-5" />
          </Button>
          <Button variant={viewMode === 'card' ? 'secondary' : 'outline'} size="icon" onClick={() => setViewMode('card')} aria-label="Card View">
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button onClick={() => router.push('/dashboard/residents/add')} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Resident
          </Button>
        </div>
      </div>

      <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current ({currentResidents.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingResidents.length})</TabsTrigger>
          <TabsTrigger value="former">Former ({formerResidents.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="current">
          {viewMode === 'table' ? (
            <DataTable columns={activeColumns} data={currentResidents} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {currentResidents.map(res => <ResidentCard key={res.id} resident={res} rooms={rooms} onEdit={handleNavigateToEdit} onDelete={handleDeleteConfirmation} onRecordPayment={openPaymentForm} onTransfer={handleOpenTransferDialog} onVacate={handleOpenVacateDialog}/>)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="upcoming">
           {viewMode === 'table' ? (
            <DataTable columns={upcomingColumns} data={upcomingResidents} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {upcomingResidents.map(res => <ResidentCard key={res.id} resident={res} rooms={rooms} onEdit={handleNavigateToEdit} onDelete={handleDeleteConfirmation} onActivate={handleOpenActivateDialog} />)}
            </div>
          )}
        </TabsContent>
        <TabsContent value="former">
           {viewMode === 'table' ? (
            <DataTable columns={formerColumns} data={formerResidents} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {formerResidents.map(res => <ResidentCard key={res.id} resident={res} rooms={rooms} onEdit={handleNavigateToEdit} onDelete={handleDeleteConfirmation} onReactivate={handleOpenReactivateDialog} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {displayedResidents.length === 0 && (
        <div className="text-center py-10 text-muted-foreground bg-card border rounded-md mt-4">
            No residents found for "{activeTab}" status {searchTerm && `matching "${searchTerm}"`}.
        </div>
      )}


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

