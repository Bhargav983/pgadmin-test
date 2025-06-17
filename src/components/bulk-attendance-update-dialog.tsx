
"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
const NO_CHANGE_STATUS_VALUE = "__no_change_status__"; // Sentinel value for "No Change"

// Schema for bulk updates - all fields are optional
const BulkAttendanceUpdateSchema = z.object({
  checkInTime: z.string().nullable().optional()
    .refine(val => !val || val === "" || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), { message: "Invalid time format (HH:MM) or leave empty." }),
  checkOutTime: z.string().nullable().optional()
    .refine(val => !val || val === "" || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), { message: "Invalid time format (HH:MM) or leave empty." }),
  status: z.enum(['Pending', 'Present', 'Late', 'Absent', 'On Leave']).optional(), // Status remains optional in the schema
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
      checkInTime: "",
      checkOutTime: "",
      status: undefined, // No default status for bulk
      notes: "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        checkInTime: "",
        checkOutTime: "",
        status: undefined,
        notes: "",
      });
    }
  }, [isOpen, form]);

  const handleFormSubmit = (values: BulkAttendanceUpdateValues) => {
    const submittedValues: BulkAttendanceUpdateValues = {};
    // Only include status if it's actually set (not undefined due to 'No Change')
    if (values.status !== undefined) {
      submittedValues.status = values.status;
    }
    // For time and notes, handle empty strings as intentions to clear or not set.
    // The parent component will interpret null vs actual values.
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
            Applying to {numSelected} resident(s) for {formattedDisplayDate}. Leave fields blank to not change existing values for those fields.
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
                  <FormLabel>Status (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === NO_CHANGE_STATUS_VALUE ? undefined : value as AttendanceStatus)} 
                    value={field.value || NO_CHANGE_STATUS_VALUE}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="No Change / Select Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_CHANGE_STATUS_VALUE}>No Change</SelectItem>
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

