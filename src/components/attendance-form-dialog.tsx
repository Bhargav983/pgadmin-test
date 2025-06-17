
"use client";

import React from "react";
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
import { AttendanceFormValidationSchema } from "@/lib/schemas";
import type { AttendanceFormValues, AttendanceStatus } from "@/lib/types";
import { format } from 'date-fns';

interface AttendanceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AttendanceFormValues) => void;
  residentName: string;
  currentDate: string; // YYYY-MM-DD
  defaultValues: Partial<AttendanceFormValues>;
}

const attendanceStatuses: AttendanceStatus[] = ['Pending', 'Present', 'Late', 'Absent', 'On Leave'];

export function AttendanceFormDialog({
  isOpen,
  onClose,
  onSubmit,
  residentName,
  currentDate,
  defaultValues,
}: AttendanceFormDialogProps) {
  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(AttendanceFormValidationSchema),
    defaultValues: {
      checkInTime: defaultValues.checkInTime || null,
      checkOutTime: defaultValues.checkOutTime || null,
      status: defaultValues.status || 'Pending',
      notes: defaultValues.notes || null,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        checkInTime: defaultValues.checkInTime || null,
        checkOutTime: defaultValues.checkOutTime || null,
        status: defaultValues.status || 'Pending',
        notes: defaultValues.notes || null,
      });
    }
  }, [isOpen, defaultValues, form]);

  const handleFormSubmit = (values: AttendanceFormValues) => {
    onSubmit(values);
  };
  
  const formattedDisplayDate = format(new Date(currentDate.replace(/-/g, '\/')), "PPP");


  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Log Attendance for {residentName}</DialogTitle>
          <DialogDescription>
            Date: {formattedDisplayDate}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="checkInTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-In Time (HH:MM)</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="checkOutTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-Out Time (HH:MM)</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field}
                      value={field.value || ""}
                     />
                  </FormControl>
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
                  <Select onValueChange={field.onChange} value={field.value || 'Pending'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {attendanceStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Late due to exam, on approved leave..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {form.formState.isSubmitting ? "Saving..." : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
