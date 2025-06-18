
"use client";

import React, { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ManagedUserSchema } from "@/lib/schemas";
import type { ManagedUser, ManagedUserFormValues, ManagedUserRole, ManagedUserStatus } from "@/lib/types";

interface ManagedUserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ManagedUserFormValues, editingUserId?: string) => void;
  editingUser?: ManagedUser | null;
}

const userRoles: ManagedUserRole[] = ['Admin', 'Manager'];
const userStatuses: ManagedUserStatus[] = ['active', 'inactive'];

export function ManagedUserFormDialog({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
}: ManagedUserFormDialogProps) {
  const form = useForm<ManagedUserFormValues>({
    resolver: zodResolver(ManagedUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: 'Manager',
      status: 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        form.reset({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          status: editingUser.status,
        });
      } else {
        form.reset({
          name: "",
          email: "",
          role: 'Manager',
          status: 'active',
        });
      }
    }
  }, [isOpen, editingUser, form]);

  const handleFormSubmit = (values: ManagedUserFormValues) => {
    onSubmit(values, editingUser?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
          <DialogDescription>
            {editingUser ? "Update the details of the user." : "Create a new admin or manager account."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Alex Smith" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input type="email" placeholder="e.g., alex.smith@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {userStatuses.map(status => (
                        <SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {form.formState.isSubmitting ? "Saving..." : (editingUser ? "Save Changes" : "Add User")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
