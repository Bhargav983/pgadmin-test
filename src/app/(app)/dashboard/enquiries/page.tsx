
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getEnquiryColumns } from "./enquiry-columns";
import { EnquiryFormDialog } from "./enquiry-form-dialog";
import type { Enquiry, EnquiryFormValues, EnquiryStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, MessageSquare, Filter } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { enquiryStatuses } from '@/lib/types';

const ENQUIRIES_STORAGE_KEY = 'pgEnquiries';

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

export default function EnquiriesPage() {
  const [allEnquiries, setAllEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStatusTab, setActiveStatusTab] = useState<EnquiryStatus | "all">("all");

  const { toast } = useToast();

  const fetchEnquiriesData = useCallback(() => {
    setIsLoading(true);
    const storedEnquiries = getStoredData<Enquiry>(ENQUIRIES_STORAGE_KEY);
    setAllEnquiries(storedEnquiries.sort((a,b) => new Date(b.enquiryDate).getTime() - new Date(a.enquiryDate).getTime()));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchEnquiriesData();
    const handleStorageChange = () => fetchEnquiriesData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchEnquiriesData]);

  useEffect(() => {
    let currentFiltered = [...allEnquiries];
    if (activeStatusTab !== "all") {
      currentFiltered = currentFiltered.filter(e => e.status === activeStatusTab);
    }
    if (searchTerm) {
      currentFiltered = currentFiltered.filter(e => 
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredEnquiries(currentFiltered);
  }, [allEnquiries, activeStatusTab, searchTerm]);

  const handleOpenForm = (enquiry?: Enquiry) => {
    setEditingEnquiry(enquiry || null);
    setIsFormOpen(true);
  };

  const handleSaveEnquiry = (values: EnquiryFormValues, editingEnquiryId?: string) => {
    let currentEnquiries = getStoredData<Enquiry>(ENQUIRIES_STORAGE_KEY);
    if (editingEnquiryId) {
      const enquiryIndex = currentEnquiries.findIndex(e => e.id === editingEnquiryId);
      if (enquiryIndex > -1) {
        currentEnquiries[enquiryIndex] = { ...currentEnquiries[enquiryIndex], ...values };
        toast({ title: "Enquiry Updated", description: "Enquiry details have been updated." });
      }
    } else {
      const newEnquiry: Enquiry = {
        id: crypto.randomUUID(),
        ...values,
      };
      currentEnquiries.push(newEnquiry);
      toast({ title: "Enquiry Added", description: "New enquiry has been logged." });
    }
    setStoredData(ENQUIRIES_STORAGE_KEY, currentEnquiries);
    fetchEnquiriesData();
    setIsFormOpen(false);
    setEditingEnquiry(null);
  };

  const handleUpdateStatus = (enquiryId: string, newStatus: EnquiryStatus) => {
    let currentEnquiries = getStoredData<Enquiry>(ENQUIRIES_STORAGE_KEY);
    const enquiryIndex = currentEnquiries.findIndex(e => e.id === enquiryId);
    if (enquiryIndex > -1) {
      currentEnquiries[enquiryIndex].status = newStatus;
      setStoredData(ENQUIRIES_STORAGE_KEY, currentEnquiries);
      fetchEnquiriesData();
      toast({ title: "Status Updated", description: `Enquiry status changed to ${newStatus}.` });
    }
  };
  
  const handleDeleteConfirmation = (enquiryId: string) => {
    setEnquiryToDelete(enquiryId);
    setIsDeleteDialogOpen(true);
  };

  const executeDeleteEnquiry = () => {
    if (!enquiryToDelete) return;
    const updatedEnquiries = allEnquiries.filter(e => e.id !== enquiryToDelete);
    setStoredData(ENQUIRIES_STORAGE_KEY, updatedEnquiries);
    fetchEnquiriesData();
    toast({ title: "Enquiry Deleted", description: "Enquiry has been removed." });
    setIsDeleteDialogOpen(false);
    setEnquiryToDelete(null);
  };

  const columns = getEnquiryColumns(handleOpenForm, handleUpdateStatus, handleDeleteConfirmation);

  const statusCounts = useMemo(() => {
    const counts: Record<EnquiryStatus | "all", number> = { all: allEnquiries.length, New: 0, 'Follow-up': 0, Converted: 0, Closed: 0 };
    allEnquiries.forEach(e => {
      counts[e.status]++;
    });
    return counts;
  }, [allEnquiries]);


  if (isLoading && !filteredEnquiries.length) { // Show loader only if no data yet
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
          <MessageSquare className="mr-3 h-8 w-8 text-primary" /> Enquiries Management
        </h1>
        <Button onClick={() => handleOpenForm()} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Enquiry
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
                <CardTitle className="font-headline">Enquiry Log</CardTitle>
                <CardDescription>View, manage, and track all potential resident enquiries.</CardDescription>
            </div>
             <Input
                placeholder="Search by name, contact, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeStatusTab} onValueChange={(value) => setActiveStatusTab(value as EnquiryStatus | "all")} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
              {enquiryStatuses.map(status => (
                <TabsTrigger key={status} value={status}>{status} ({statusCounts[status]})</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {isLoading && filteredEnquiries.length === 0 ? (
             <div className="flex h-40 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          ) : filteredEnquiries.length > 0 ? (
            <DataTable columns={columns} data={filteredEnquiries} filterColumn="name" filterInputPlaceholder="Search... (already above)" />
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No enquiries match the current filters {searchTerm && `or search term "${searchTerm}"`}.
            </p>
          )}
        </CardContent>
      </Card>

      <EnquiryFormDialog
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingEnquiry(null); }}
        onSubmit={handleSaveEnquiry}
        editingEnquiry={editingEnquiry}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Enquiry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will permanently delete this enquiry record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEnquiryToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteEnquiry} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
