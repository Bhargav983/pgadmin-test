
"use client";

import React, { useState, useEffect } from "react";
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
  FormDescription
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
import { ComplaintSchema } from "@/lib/schemas";
import type { Complaint, ComplaintFormValues, Resident, ComplaintStatus, ComplaintCategory } from "@/lib/types";
import { complaintCategories } from "@/lib/types"; // Import categories

interface ComplaintFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ComplaintFormValues, editingComplaintId?: string) => void;
  editingComplaint?: Complaint | null;
  activeResidents: Resident[];
}

const complaintStatuses: ComplaintStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

export function ComplaintFormDialog({
  isOpen,
  onClose,
  onSubmit,
  editingComplaint,
  activeResidents,
}: ComplaintFormDialogProps) {
  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(ComplaintSchema),
    defaultValues: {
      residentId: editingComplaint?.residentId || "",
      category: editingComplaint?.category || "",
      customCategory: (editingComplaint && !complaintCategories.includes(editingComplaint.category as ComplaintCategory)) ? editingComplaint.category : "",
      description: editingComplaint?.description || "",
      status: editingComplaint?.status || 'Open',
      resolutionNotes: editingComplaint?.resolutionNotes || "",
    },
  });

  const [showCustomCategory, setShowCustomCategory] = useState(
    !!editingComplaint && editingComplaint.category === "Other"
  );

  useEffect(() => {
    if (isOpen) {
      const isOtherCategory = editingComplaint?.category && !complaintCategories.includes(editingComplaint.category as ComplaintCategory);
      form.reset({
        residentId: editingComplaint?.residentId || "",
        category: isOtherCategory ? "Other" : (editingComplaint?.category || ""),
        customCategory: isOtherCategory ? editingComplaint.category : "",
        description: editingComplaint?.description || "",
        status: editingComplaint?.status || 'Open',
        resolutionNotes: editingComplaint?.resolutionNotes || "",
      });
      setShowCustomCategory(isOtherCategory || editingComplaint?.category === "Other");
    }
  }, [isOpen, editingComplaint, form]);

  const selectedCategory = form.watch("category");

  useEffect(() => {
    if (selectedCategory === "Other") {
      setShowCustomCategory(true);
    } else {
      setShowCustomCategory(false);
      form.setValue("customCategory", ""); // Clear custom category if not 'Other'
    }
  }, [selectedCategory, form]);


  const handleFormSubmit = (values: ComplaintFormValues) => {
    const finalValues: ComplaintFormValues = { ...values };
    if (values.category === "Other" && values.customCategory) {
      finalValues.category = values.customCategory;
    }
    delete finalValues.customCategory; // Remove temp field

    onSubmit(finalValues, editingComplaint?.id);
  };

  const isResolving = form.watch("status") === 'Resolved' || form.watch("status") === 'Closed';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{editingComplaint ? "Edit Complaint" : "Add New Complaint"}</DialogTitle>
          <DialogDescription>
            {editingComplaint ? "Update the details of the complaint." : "Log a new complaint from a resident."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="residentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resident</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={activeResidents.length === 0}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={activeResidents.length > 0 ? "Select resident" : "No active residents"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeResidents.map(res => (
                        <SelectItem key={res.id} value={res.id}>{res.name} (Room: {res.roomId ? res.roomId : 'N/A'})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {activeResidents.length === 0 && <FormDescription className="text-destructive">Add active residents to log complaints.</FormDescription>}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complaint category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {complaintCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCustomCategory && (
              <FormField
                control={form.control}
                name="customCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specify Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Appliance Issue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detailed description of the complaint..." {...field} rows={3} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {complaintStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(isResolving || editingComplaint?.resolutionNotes) && (
              <FormField
                control={form.control}
                name="resolutionNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Details about how the complaint was resolved..." {...field} value={field.value || ""} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || activeResidents.length === 0} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {form.formState.isSubmitting ? "Saving..." : (editingComplaint ? "Save Changes" : "Add Complaint")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
