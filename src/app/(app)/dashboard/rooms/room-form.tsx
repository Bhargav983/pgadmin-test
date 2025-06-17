
"use client";

import * as React from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoomSchema } from "@/lib/schemas";
import type { Room, RoomFormValues } from "@/lib/types";

interface RoomFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: RoomFormValues) => Promise<void>;
  defaultValues?: Partial<Room>;
  isEditing: boolean;
}

export function RoomForm({ isOpen, onClose, onSubmit, defaultValues, isEditing }: RoomFormProps) {
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(RoomSchema),
    defaultValues: {
      roomNumber: defaultValues?.roomNumber || "",
      capacity: defaultValues?.capacity || 1,
      rent: defaultValues?.rent || 0,
      floorNumber: defaultValues?.floorNumber || 0,
      facilities: defaultValues?.facilities?.join(', ') || "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (defaultValues) {
        form.reset({
          roomNumber: defaultValues.roomNumber || "",
          capacity: defaultValues.capacity || 1,
          rent: defaultValues.rent || 0,
          floorNumber: defaultValues.floorNumber || 0,
          facilities: defaultValues.facilities?.join(', ') || "",
        });
      } else {
        form.reset({ roomNumber: "", capacity: 1, rent: 0, floorNumber: 0, facilities: "" });
      }
    }
  }, [defaultValues, form, isOpen]);


  const handleFormSubmit = async (values: RoomFormValues) => {
    await onSubmit(values);
    // form.reset(); // Resetting is handled by useEffect on isOpen change now
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{isEditing ? "Edit Room" : "Add New Room"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details of the room." : "Fill in the details to add a new room to the PG."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 101, G-02" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="floorNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor Number</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 0 for Ground, 1 for First" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (persons)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 2" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rent (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 5000" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facilities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Facilities (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., AC, Wi-Fi, Geyser, Balcony" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter facilities separated by commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {form.formState.isSubmitting ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save Changes" : "Add Room")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
