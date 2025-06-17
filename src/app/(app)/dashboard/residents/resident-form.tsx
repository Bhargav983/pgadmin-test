"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
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
import { ResidentSchema } from "@/lib/schemas";
import type { Resident, ResidentFormValues, Room } from "@/lib/types";

interface ResidentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ResidentFormValues) => Promise<void>;
  defaultValues?: Partial<Resident>;
  isEditing: boolean;
  availableRooms: Room[];
}

export function ResidentForm({ isOpen, onClose, onSubmit, defaultValues, isEditing, availableRooms }: ResidentFormProps) {
  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(ResidentSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      contact: defaultValues?.contact || "",
      personalInfo: defaultValues?.personalInfo || "",
      roomId: defaultValues?.roomId || null,
    },
  });

  React.useEffect(() => {
     if (isOpen) { // Reset form only when dialog opens
      if (defaultValues) {
        form.reset({
          name: defaultValues.name || "",
          contact: defaultValues.contact || "",
          personalInfo: defaultValues.personalInfo || "",
          roomId: defaultValues.roomId || null,
        });
      } else {
        form.reset({ name: "", contact: "", personalInfo: "", roomId: null });
      }
    }
  }, [defaultValues, form, isOpen]);


  const handleFormSubmit = async (values: ResidentFormValues) => {
    await onSubmit(values);
    // form.reset(); // Resetting here might clear the form before the dialog closes on success
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? "Edit Resident" : "Add New Resident"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details of the resident." : "Fill in the details to add a new resident."}
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
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9876543210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Room</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || ""} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Select a room</SelectItem>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id} disabled={room.currentOccupancy >= room.capacity && room.id !== defaultValues?.roomId}>
                          {room.roomNumber} (Occupancy: {room.currentOccupancy}/{room.capacity}) {room.currentOccupancy >= room.capacity && room.id !== defaultValues?.roomId ? " - Full" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Information (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Emergency contact, allergies, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                 {form.formState.isSubmitting ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save Changes" : "Add Resident")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
