
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { EnquirySchema } from "@/lib/schemas";
import type { Enquiry, EnquiryFormValues, EnquiryStatus } from "@/lib/types";
import { enquiryStatuses } from "@/lib/types";

interface EnquiryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: EnquiryFormValues, editingEnquiryId?: string) => void;
  editingEnquiry?: Enquiry | null;
}

export function EnquiryFormDialog({
  isOpen,
  onClose,
  onSubmit,
  editingEnquiry,
}: EnquiryFormDialogProps) {
  const form = useForm<EnquiryFormValues>({
    resolver: zodResolver(EnquirySchema),
    defaultValues: {
      name: "",
      contact: "",
      email: "",
      enquiryDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'New',
      notes: "",
      nextFollowUpDate: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingEnquiry) {
        form.reset({
          name: editingEnquiry.name || "",
          contact: editingEnquiry.contact || "",
          email: editingEnquiry.email || "",
          enquiryDate: editingEnquiry.enquiryDate ? format(new Date(editingEnquiry.enquiryDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          status: editingEnquiry.status || 'New',
          notes: editingEnquiry.notes || "",
          nextFollowUpDate: editingEnquiry.nextFollowUpDate ? format(new Date(editingEnquiry.nextFollowUpDate), 'yyyy-MM-dd') : null,
        });
      } else {
        form.reset({
          name: "",
          contact: "",
          email: "",
          enquiryDate: format(new Date(), 'yyyy-MM-dd'),
          status: 'New',
          notes: "",
          nextFollowUpDate: null,
        });
      }
    }
  }, [isOpen, editingEnquiry, form]);

  const handleFormSubmit = (values: EnquiryFormValues) => {
    onSubmit(values, editingEnquiry?.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">{editingEnquiry ? "Edit Enquiry" : "Add New Enquiry"}</DialogTitle>
          <DialogDescription>
            {editingEnquiry ? "Update the details of the enquiry." : "Log a new enquiry from a potential resident."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email Address (Optional)</FormLabel>
                    <FormControl><Input type="email" placeholder="e.g., jane.doe@example.com" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="enquiryDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Enquiry Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value && isValid(new Date(field.value)) ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value && isValid(new Date(field.value)) ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="nextFollowUpDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Next Follow-up Date (Optional)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                >
                                {field.value && isValid(new Date(field.value)) ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value && isValid(new Date(field.value)) ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                                initialFocus
                                disabled={(date) =>
                                    form.getValues("enquiryDate") && isValid(new Date(form.getValues("enquiryDate"))) ? date < new Date(form.getValues("enquiryDate")) : false
                                }
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
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
                      {enquiryStatuses.map(status => (
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
                  <FormControl><Textarea placeholder="e.g., Interested in 2-sharing AC room, budget 8k..." {...field} value={field.value ?? ""} rows={3} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                {form.formState.isSubmitting ? "Saving..." : (editingEnquiry ? "Save Changes" : "Add Enquiry")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
