
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getManagedUserColumns } from "./user-columns";
import { ManagedUserFormDialog } from "@/components/managed-user-form-dialog";
import type { ManagedUser, ManagedUserFormValues, ManagedUserStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Users } from "lucide-react";
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

const MANAGED_USERS_STORAGE_KEY = 'pgManagedUsers';

const getStoredData = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse localStorage data for key:", key, e);
    // Initialize with some dummy data if parsing fails or it's empty for demo purposes
    if (key === MANAGED_USERS_STORAGE_KEY) {
        const dummyUsers: ManagedUser[] = [
            { id: crypto.randomUUID(), name: "Jane Doe (Admin)", email: "jane.admin@example.com", role: "Admin", status: "active" },
            { id: crypto.randomUUID(), name: "John Smith (Manager)", email: "john.manager@example.com", role: "Manager", status: "active" },
            { id: crypto.randomUUID(), name: "Alice Brown (Manager)", email: "alice.manager@example.com", role: "Manager", status: "inactive" },
        ];
        localStorage.setItem(MANAGED_USERS_STORAGE_KEY, JSON.stringify(dummyUsers));
        return dummyUsers as T[];
    }
    return [];
  }
};

const setStoredData = <T,>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export default function UserManagementPage() {
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  const fetchUsersData = useCallback(() => {
    setIsLoading(true);
    const storedUsers = getStoredData<ManagedUser>(MANAGED_USERS_STORAGE_KEY);
    setManagedUsers(storedUsers.sort((a,b) => a.name.localeCompare(b.name)));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUsersData();
    // Add a storage event listener if you want to sync across tabs (optional)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === MANAGED_USERS_STORAGE_KEY) {
        fetchUsersData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUsersData]);

  const handleOpenForm = (user?: ManagedUser) => {
    setEditingUser(user || null);
    setIsFormOpen(true);
  };

  const handleSaveUser = (values: ManagedUserFormValues, editingUserId?: string) => {
    let allUsers = getStoredData<ManagedUser>(MANAGED_USERS_STORAGE_KEY);
    if (editingUserId) {
      const userIndex = allUsers.findIndex(u => u.id === editingUserId);
      if (userIndex > -1) {
        allUsers[userIndex] = { ...allUsers[userIndex], ...values };
        toast({ title: "User Updated", description: `${values.name}'s details have been updated.` });
      }
    } else {
      // Check for duplicate email before adding
      if (allUsers.some(user => user.email.toLowerCase() === values.email.toLowerCase())) {
        toast({ title: "Error", description: "A user with this email address already exists.", variant: "destructive" });
        return;
      }
      const newUser: ManagedUser = {
        id: crypto.randomUUID(),
        ...values,
      };
      allUsers.push(newUser);
      toast({ title: "User Added", description: `${values.name} has been added as a ${values.role}.` });
    }
    setStoredData(MANAGED_USERS_STORAGE_KEY, allUsers);
    fetchUsersData();
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleDeleteConfirmation = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  const executeDeleteUser = () => {
    if (!userToDelete) return;
    const updatedUsers = managedUsers.filter(u => u.id !== userToDelete);
    setStoredData(MANAGED_USERS_STORAGE_KEY, updatedUsers);
    fetchUsersData();
    toast({ title: "User Deleted", description: "User has been removed." });
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleToggleStatus = (userId: string, currentStatus: ManagedUserStatus) => {
    let allUsers = getStoredData<ManagedUser>(MANAGED_USERS_STORAGE_KEY);
    const userIndex = allUsers.findIndex(u => u.id === userId);
    if (userIndex > -1) {
      const newStatus: ManagedUserStatus = currentStatus === 'active' ? 'inactive' : 'active';
      allUsers[userIndex].status = newStatus;
      setStoredData(MANAGED_USERS_STORAGE_KEY, allUsers);
      fetchUsersData();
      toast({ title: "Status Updated", description: `${allUsers[userIndex].name}'s status changed to ${newStatus}.` });
    }
  };

  const columns = getManagedUserColumns(handleOpenForm, handleDeleteConfirmation, handleToggleStatus);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-headline font-semibold flex items-center">
          <Users className="mr-3 h-8 w-8 text-primary" /> User Management
        </h1>
        <Button onClick={() => handleOpenForm()} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New User
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Managed Users List</CardTitle>
          <CardDescription>View, add, edit, or remove Admin and Manager accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {managedUsers.length > 0 ? (
            <DataTable columns={columns} data={managedUsers} filterColumn="name" filterInputPlaceholder="Filter by name or email..." />
          ) : (
            <p className="text-muted-foreground text-center py-8">No users found. Click "Add New User" to get started.</p>
          )}
        </CardContent>
      </Card>

      <ManagedUserFormDialog
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingUser(null); }}
        onSubmit={handleSaveUser}
        editingUser={editingUser}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will permanently delete this user account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
