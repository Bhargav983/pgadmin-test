
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, User, Contact, Shield, FileText, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ResidentSchema } from "@/lib/schemas";
import type { Resident, ResidentFormValues, Room, ResidentStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface ResidentFormProps {
  onSubmit: (values: ResidentFormValues) => Promise<void>;
  defaultValues?: Partial<Resident>;
  isEditing: boolean;
  availableRooms: Room[];
  onCancel: () => void;
}

const residentStatuses: { value: ResidentStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "former", label: "Former" }, 
];

export function ResidentForm({ onSubmit, defaultValues, isEditing, availableRooms, onCancel }: ResidentFormProps) {
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
      photoUrl: defaultValues?.photoUrl || "",
      idProofUrl: defaultValues?.idProofUrl || "",
      guardianName: defaultValues?.guardianName || "",
      guardianContact: defaultValues?.guardianContact || "",
    },
  });

  React.useEffect(() => {
    if (defaultValues) {
      form.reset({
        name: defaultValues.name || "",
        contact: defaultValues.contact || "",
        enquiryDate: defaultValues.enquiryDate || null,
        joiningDate: defaultValues.joiningDate || null,
        personalInfo: defaultValues.personalInfo || "",
        roomId: defaultValues.roomId || null,
        status: defaultValues.status || (isEditing ? "active" : "upcoming"),
        photoUrl: defaultValues.photoUrl || "",
        idProofUrl: defaultValues.idProofUrl || "",
        guardianName: defaultValues.guardianName || "",
        guardianContact: defaultValues.guardianContact || "",
      });
    } else { 
      form.reset({ 
        name: "", contact: "", enquiryDate: null, joiningDate: null, 
        personalInfo: "", roomId: null, status: "upcoming",
        photoUrl: "", idProofUrl: "", guardianName: "", guardianContact: ""
      });
    }
  }, [defaultValues, form, isEditing]);

  const handleFormSubmit = async (values: ResidentFormValues) => {
    const processedValues: ResidentFormValues = {
      ...values,
      enquiryDate: values.enquiryDate === "" ? null : values.enquiryDate,
      joiningDate: values.joiningDate === "" ? null : values.joiningDate,
      photoUrl: values.photoUrl === "" ? null : values.photoUrl,
      idProofUrl: values.idProofUrl === "" ? null : values.idProofUrl,
      guardianName: values.guardianName === "" ? null : values.guardianName,
      guardianContact: values.guardianContact === "" ? null : values.guardianContact,
    };
    await onSubmit(processedValues);
  };
  
  const photoPreview = form.watch("photoUrl");
  const idProofPreview = form.watch("idProofUrl");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><User className="mr-2 h-5 w-5 text-primary"/>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
              name="personalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Personal Information (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Emergency contact, allergies, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><ImageIcon className="mr-2 h-5 w-5 text-primary"/>Photo & ID</CardTitle>
            <CardDescription>Enter URLs for photo and ID proof images. Actual file uploads can be integrated later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://placehold.co/100x100.png" {...field} />
                  </FormControl>
                  {photoPreview && (
                     <Image src={photoPreview} alt="Photo Preview" width={100} height={100} className="mt-2 rounded-md border" data-ai-hint="person portrait" />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="idProofUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Proof URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://placehold.co/300x200.png" {...field} />
                  </FormControl>
                   {idProofPreview && (
                     <Image src={idProofPreview} alt="ID Proof Preview" width={300} height={200} className="mt-2 rounded-md border object-contain" data-ai-hint="document id" />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><Shield className="mr-2 h-5 w-5 text-primary"/>Guardian Information (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="guardianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guardianContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guardian Contact Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 9876543211" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Status & Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
             {form.formState.isSubmitting ? (isEditing ? "Saving..." : "Adding...") : (isEditing ? "Save Changes" : "Add Resident")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
