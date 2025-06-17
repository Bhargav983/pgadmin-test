
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ResidentSchema } from "@/lib/schemas";
import type { Resident, ResidentFormValues, Room, ResidentStatus } from "@/lib/types";

interface ResidentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ResidentFormValues) => Promise<void>;
  defaultValues?: Partial<Resident>;
  isEditing: boolean;
  availableRooms: Room[];
}

const residentStatuses: { value: ResidentStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "former", label: "Former" }, 
];

export function ResidentForm({ isOpen, onClose, onSubmit, defaultValues, isEditing, availableRooms }: ResidentFormProps) {
  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(ResidentSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      contact: defaultValues?.contact || "",
      enquiryDate: defaultValues?.enquiryDate || null,
      joiningDate: defaultValues?.joiningDate || null,
      personalInfo: defaultValues?.personalInfo || "",
      roomId: defaultValues?.roomId || null,
      status: defaultValues?.status || "upcoming",
    },
  });

  React.useEffect(() => {
     if (isOpen) { 
      if (defaultValues) {
        form.reset({
          name: defaultValues.name || "",
          contact: defaultValues.contact || "",
          enquiryDate: defaultValues.enquiryDate || null,
          joiningDate: defaultValues.joiningDate || null,
          personalInfo: defaultValues.personalInfo || "",
          roomId: defaultValues.roomId || null,
          status: defaultValues.status || (isEditing ? "active" : "upcoming"),
        });
      } else { 
        form.reset({ name: "", contact: "", enquiryDate: null, joiningDate: null, personalInfo: "", roomId: null, status: "upcoming" });
      }
    }
  }, [defaultValues, form, isOpen, isEditing]);


  const handleFormSubmit = async (values: ResidentFormValues) => {
    // Ensure empty strings for dates are converted to null
    const processedValues = {
      ...values,
      enquiryDate: values.enquiryDate === "" ? null : values.enquiryDate,
      joiningDate: values.joiningDate === "" ? null : values.joiningDate,
    };
    await onSubmit(processedValues);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
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
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="enquiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Enquiry Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
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
                name="joiningDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Joining Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
                          initialFocus
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
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Room</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || undefined} 
                    disabled={form.getValues("status") === 'former'} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room (optional for upcoming)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       <SelectItem value="null">Unassigned</SelectItem>
                      {availableRooms
                        .filter(room => room.id && room.id.trim() !== "") 
                        .map((room) => (
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === 'former') { 
                        form.setValue('roomId', null);
                      }
                    }} 
                    value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {residentStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value} disabled={isEditing && defaultValues?.status === 'former' && status.value !== 'former' && status.value !== 'upcoming'}> 
                          {status.label}
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
