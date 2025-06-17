
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod"; // Added this import
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
import type { AttendanceStatus } from "@/lib/types";
import { format } from 'date-fns';

const attendanceStatuses: AttendanceStatus[] = ['Pending', 'Present', 'Late', 'Absent', 'On Leave'];

// Schema for bulk updates - all fields are optional
const BulkAttendanceUpdateSchema = z.object({
  checkInTime: z.string().nullable().optional()
    .refine(val => !val || val === "" || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), { message: "Invalid time format (HH:MM) or leave empty." }),
  checkOutTime: z.string().nullable().optional()
    .refine(val => !val || val === "" || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), { message: "Invalid time format (HH:MM) or leave empty." }),
  status: z.enum(['Pending', 'Present', 'Late', 'Absent', 'On Leave']).optional(),
  notes: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.checkInTime && data.checkOutTime && data.checkOutTime < data.checkInTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Check-out time cannot be earlier than check-in time.",
      path: ["checkOutTime"],
    });
  }
});

export type BulkAttendanceUpdateValues = z.infer<typeof BulkAttendanceUpdateSchema>;

interface BulkAttendanceUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: BulkAttendanceUpdateValues) => void;
  numSelected: number;
  currentDate: string; // YYYY-MM-DD
}

export function BulkAttendanceUpdateDialog({
  isOpen,
  onClose,
  onSubmit,
  numSelected,
  currentDate,
}: BulkAttendanceUpdateDialogProps) {
  const form = useForm<BulkAttendanceUpdateValues>({
    resolver: zodResolver(BulkAttendanceUpdateSchema),
    defaultValues: {
      checkInTime: "", // Explicitly empty string for controlled input
      checkOutTime: "",// Explicitly empty string
      status: undefined, // No default status for bulk
      notes: "", // Explicitly empty string
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({ // Reset to empty when dialog opens
        checkInTime: "",
        checkOutTime: "",
        status: undefined,
        notes: "",
      });
    }
  }, [isOpen, form]);

  const handleFormSubmit = (values: BulkAttendanceUpdateValues) => {
    // Filter out undefined values before submitting
    const submittedValues: BulkAttendanceUpdateValues = {};
    if (values.status !== undefined) submittedValues.status = values.status;
    // For time and notes, empty string from form means "don't change if null was original",
    // or set to null if they explicitly want to clear it.
    // The handler in page.tsx will interpret empty strings vs null vs actual values.
    // For this dialog, we pass what's entered. An empty string for time means "user wants to clear/not set".
    if (values.checkInTime !== undefined) submittedValues.checkInTime = values.checkInTime === "" ? null : values.checkInTime;
    if (values.checkOutTime !== undefined) submittedValues.checkOutTime = values.checkOutTime === "" ? null : values.checkOutTime;
    if (values.notes !== undefined) submittedValues.notes = values.notes === "" ? null : values.notes;
    
    onSubmit(submittedValues);
  };
  
  const formattedDisplayDate = format(new Date(currentDate.replace(/-/g, '\/')), "PPP");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Bulk Update Attendance</DialogTitle>
          <DialogDescription>
            Applying to {numSelected} resident(s) for {formattedDisplayDate}. Leave fields blank to not change existing values for those fields (except status, which will default to Pending if not set).
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
                      value={field.value || ""} // Ensure controlled input
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
                      value={field.value || ""} // Ensure controlled input
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
                  <FormLabel>Status (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No Change / Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">No Change</SelectItem>
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
                    <Textarea placeholder="Enter notes to apply to all selected..." {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {form.formState.isSubmitting ? "Applying..." : "Apply to Selected"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
