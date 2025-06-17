
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getComplaintColumns } from "./complaint-columns";
import { ComplaintFormDialog } from "@/components/complaint-form-dialog";
import type { Complaint, ComplaintFormValues, Resident, Room, DisplayComplaint, ComplaintStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format } from 'date-fns';

const COMPLAINTS_STORAGE_KEY = 'pgComplaints';
const RESIDENTS_STORAGE_KEY = 'pgResidents';
const ROOMS_STORAGE_KEY = 'pgRooms';

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

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<DisplayComplaint[]>([]);
  const [activeResidents, setActiveResidents] = useState<Resident[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  const fetchComplaintsData = useCallback(() => {
    setIsLoading(true);
    const storedComplaints = getStoredData<Complaint>(COMPLAINTS_STORAGE_KEY);
    // No need to fetch residents/rooms here if denormalized data is already in Complaint
    setComplaints(storedComplaints.sort((a,b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime()));
    
    // Fetch active residents for the form's dropdown
    const storedResidents = getStoredData<Resident>(RESIDENTS_STORAGE_KEY);
    setActiveResidents(storedResidents.filter(r => r.status === 'active' && r.roomId));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchComplaintsData();
    const handleStorageChange = () => fetchComplaintsData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchComplaintsData]);

  const handleOpenForm = (complaint?: Complaint) => {
    setEditingComplaint(complaint || null);
    setIsFormOpen(true);
  };

  const handleSaveComplaint = (values: ComplaintFormValues, editingComplaintId?: string) => {
    let allComplaints = getStoredData<Complaint>(COMPLAINTS_STORAGE_KEY);
    const residents = getStoredData<Resident>(RESIDENTS_STORAGE_KEY);
    const rooms = getStoredData<Room>(ROOMS_STORAGE_KEY);

    const resident = residents.find(r => r.id === values.residentId);
    if (!resident) {
      toast({ title: "Error", description: "Selected resident not found.", variant: "destructive" });
      return;
    }
    const room = rooms.find(r => r.id === resident.roomId);

    if (editingComplaintId) { // Editing existing complaint
      const complaintIndex = allComplaints.findIndex(c => c.id === editingComplaintId);
      if (complaintIndex > -1) {
        const oldComplaint = allComplaints[complaintIndex];
        allComplaints[complaintIndex] = {
          ...oldComplaint,
          residentId: values.residentId,
          residentName: resident.name,
          roomNumber: room?.roomNumber || 'N/A',
          category: values.category,
          description: values.description,
          status: values.status,
          resolutionNotes: values.resolutionNotes || null,
          dateResolved: (values.status === 'Resolved' || values.status === 'Closed') && !oldComplaint.dateResolved
                          ? new Date().toISOString()
                          : (values.status !== 'Resolved' && values.status !== 'Closed' ? null : oldComplaint.dateResolved),
        };
        toast({ title: "Complaint Updated", description: "Complaint details have been updated.", variant: "default" });
      }
    } else { // Adding new complaint
      const newComplaint: Complaint = {
        id: crypto.randomUUID(),
        residentId: values.residentId,
        residentName: resident.name,
        roomNumber: room?.roomNumber || 'N/A',
        category: values.category,
        description: values.description,
        status: values.status, // Should typically be 'Open' from form
        dateReported: new Date().toISOString(),
        resolutionNotes: values.resolutionNotes || null,
        dateResolved: (values.status === 'Resolved' || values.status === 'Closed') ? new Date().toISOString() : null,
      };
      allComplaints.push(newComplaint);
      toast({ title: "Complaint Added", description: "New complaint has been logged.", variant: "default" });
    }

    setStoredData(COMPLAINTS_STORAGE_KEY, allComplaints);
    fetchComplaintsData();
    setIsFormOpen(false);
    setEditingComplaint(null);
  };

  const handleUpdateStatus = (complaintId: string, newStatus: ComplaintStatus) => {
    let allComplaints = getStoredData<Complaint>(COMPLAINTS_STORAGE_KEY);
    const complaintIndex = allComplaints.findIndex(c => c.id === complaintId);

    if (complaintIndex > -1) {
      const updatedComplaint = { ...allComplaints[complaintIndex], status: newStatus };
      if ((newStatus === 'Resolved' || newStatus === 'Closed') && !updatedComplaint.dateResolved) {
        updatedComplaint.dateResolved = new Date().toISOString();
        if(!updatedComplaint.resolutionNotes && newStatus !== 'Closed') { // Prompt for resolution notes if resolving but not closing
             setEditingComplaint(updatedComplaint);
             setIsFormOpen(true);
             toast({ title: "Add Resolution Notes", description: `Please add resolution notes for complaint from ${updatedComplaint.residentName}.`, variant: "default" });
             return; // Don't save status yet, let form handle it.
        }
      } else if (newStatus === 'Open' || newStatus === 'In Progress') {
        updatedComplaint.dateResolved = null; // Clear resolution date if re-opened
      }
      allComplaints[complaintIndex] = updatedComplaint;
      setStoredData(COMPLAINTS_STORAGE_KEY, allComplaints);
      fetchComplaintsData();
      toast({ title: "Status Updated", description: `Complaint status changed to ${newStatus}.` });
    }
  };
  
  const handleDeleteConfirmation = (complaintId: string) => {
    setComplaintToDelete(complaintId);
    setIsDeleteDialogOpen(true);
  };

  const executeDeleteComplaint = () => {
    if (!complaintToDelete) return;
    try {
      const updatedComplaints = complaints.filter(c => c.id !== complaintToDelete);
      setStoredData(COMPLAINTS_STORAGE_KEY, updatedComplaints);
      fetchComplaintsData();
      toast({ title: "Complaint Deleted", description: "Complaint has been removed.", variant: "default" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete complaint.", variant: "destructive" });
    } finally {
      setIsDeleteDialogOpen(false);
      setComplaintToDelete(null);
    }
  };

  const columns = getComplaintColumns(handleOpenForm, handleUpdateStatus, handleDeleteConfirmation);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-headline font-semibold flex items-center">
          <Wrench className="mr-3 h-8 w-8 text-primary" /> Complaints Management
        </h1>
        <Button onClick={() => handleOpenForm()} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Complaint
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Complaint Log</CardTitle>
          <CardDescription>View and manage all resident complaints.</CardDescription>
        </CardHeader>
        <CardContent>
          {complaints.length > 0 ? (
            <DataTable columns={columns} data={complaints} filterColumn="residentName" filterInputPlaceholder="Filter by resident name..." />
          ) : (
            <p className="text-muted-foreground text-center py-8">No complaints logged yet. Click "Add New Complaint" to get started.</p>
          )}
        </CardContent>
      </Card>

      <ComplaintFormDialog
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingComplaint(null); }}
        onSubmit={handleSaveComplaint}
        editingComplaint={editingComplaint}
        activeResidents={activeResidents}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will permanently delete this complaint record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setComplaintToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteComplaint} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
