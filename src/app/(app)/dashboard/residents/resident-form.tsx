
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
  FormDescription,
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
import { CalendarIcon, User, Contact, Shield, FileText, Image as ImageIcon, UploadCloud, Layers, Mail, IndianRupee, DollarSign } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { ResidentSchema } from "@/lib/schemas";
import type { Resident, ResidentFormValues, Room, ResidentStatus } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface ResidentFormProps {
  onSubmit: (values: ResidentFormValues) => Promise<void>;
  defaultValues?: Partial<ResidentFormValues>; 
  isEditing: boolean;
  availableRooms: Room[];
  onCancel: () => void;
  initialRoomId?: string | null; 
  initialFloorNumber?: string | null; 
}

const residentStatuses: { value: ResidentStatus; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "former", label: "Former" },
];

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const UNASSIGNED_ROOM_SENTINEL = "__UNASSIGNED_ROOM_SENTINEL__";
const SELECT_FLOOR_SENTINEL = "__SELECT_FLOOR__";


export function ResidentForm({
    onSubmit,
    defaultValues,
    isEditing,
    availableRooms,
    onCancel,
    initialRoomId,
    initialFloorNumber
}: ResidentFormProps) {
  const { toast } = useToast();
  
  const getInitialFormState = React.useCallback(() => {
    let baseDefaults: Partial<ResidentFormValues> = {
      name: "",
      email: "",
      contact: "",
      enquiryDate: null,
      joiningDate: null,
      personalInfo: "",
      roomId: null,
      status: isEditing ? "active" : "upcoming",
      photoUrl: null,
      idProofUrl: null,
      guardianName: "",
      guardianContact: "",
      monthlyDiscountAmount: null,
      advanceAmount: null,
      advanceReceivedDate: null,
    };

    if (defaultValues) {
      baseDefaults = {
        ...baseDefaults,
        ...defaultValues,
        enquiryDate: defaultValues.enquiryDate && isValid(new Date(defaultValues.enquiryDate)) ? format(new Date(defaultValues.enquiryDate), 'yyyy-MM-dd') : null,
        joiningDate: defaultValues.joiningDate && isValid(new Date(defaultValues.joiningDate)) ? format(new Date(defaultValues.joiningDate), 'yyyy-MM-dd') : null,
        monthlyDiscountAmount: defaultValues.monthlyDiscountAmount || null,
        advanceAmount: defaultValues.advanceAmount || null,
        advanceReceivedDate: defaultValues.advanceReceivedDate && isValid(new Date(defaultValues.advanceReceivedDate)) ? format(new Date(defaultValues.advanceReceivedDate), 'yyyy-MM-dd') : null,
      };
    }
    
    if (initialRoomId) { 
        baseDefaults.roomId = initialRoomId;
    }

    return baseDefaults;
  }, [defaultValues, isEditing, initialRoomId]);


  const form = useForm<ResidentFormValues>({
    resolver: zodResolver(ResidentSchema),
    defaultValues: getInitialFormState(),
  });

  const [uiSelectedFloor, setUiSelectedFloor] = React.useState<string>(() => {
    if (initialFloorNumber) return initialFloorNumber;
    const currentDefaultValues = getInitialFormState();
    if (currentDefaultValues.roomId) {
      const room = availableRooms.find(r => r.id === currentDefaultValues.roomId);
      return room ? room.floorNumber.toString() : SELECT_FLOOR_SENTINEL;
    }
    return SELECT_FLOOR_SENTINEL;
  });


  React.useEffect(() => {
    const newDefaultValues = getInitialFormState();
    form.reset(newDefaultValues);

    let effectiveFloor = SELECT_FLOOR_SENTINEL;
    if (initialFloorNumber) { 
        effectiveFloor = initialFloorNumber;
    } else if (newDefaultValues.roomId) { 
        const assignedRoom = availableRooms.find(r => r.id === newDefaultValues.roomId);
        if (assignedRoom) {
            effectiveFloor = assignedRoom.floorNumber.toString();
        }
    }
    setUiSelectedFloor(effectiveFloor);

  }, [defaultValues, form, availableRooms, isEditing, initialRoomId, initialFloorNumber, getInitialFormState]);


  const floorOptions = React.useMemo(() => {
    const floors = new Set<number>();
    availableRooms.forEach(room => floors.add(room.floorNumber));
    return Array.from(floors).sort((a, b) => a - b).map(f => ({
      value: f.toString(),
      label: f === 0 ? "Ground Floor" : `Floor ${f}`
    }));
  }, [availableRooms]);

  const roomsOnSelectedFloor = React.useMemo(() => {
    if (uiSelectedFloor === SELECT_FLOOR_SENTINEL) {
      return [];
    }
    return availableRooms.filter(room => room.floorNumber.toString() === uiSelectedFloor);
  }, [availableRooms, uiSelectedFloor]);

  const handleFloorSelect = (selectedFloorValue: string) => {
    setUiSelectedFloor(selectedFloorValue);
    form.setValue('roomId', null); 
    form.trigger('roomId');
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, fieldName: "photoUrl" | "idProofUrl") => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "File too large",
          description: `Please select an image smaller than ${MAX_FILE_SIZE_MB}MB.`,
          variant: "destructive",
        });
        event.target.value = "";
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (e.g., JPG, PNG, GIF).",
          variant: "destructive",
        });
        event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue(fieldName, reader.result as string);
        form.trigger(fieldName);
      };
      reader.readAsDataURL(file);
    } else {
      form.setValue(fieldName, null);
      form.trigger(fieldName);
    }
  };

  const handleFormSubmit = async (values: ResidentFormValues) => {
    const processedValues: ResidentFormValues = {
      ...values,
      enquiryDate: values.enquiryDate ? format(parseISO(values.enquiryDate), 'yyyy-MM-dd') : null,
      joiningDate: values.joiningDate ? format(parseISO(values.joiningDate), 'yyyy-MM-dd') : null,
      photoUrl: values.photoUrl || null,
      idProofUrl: values.idProofUrl || null,
      guardianName: values.guardianName === "" ? null : values.guardianName,
      guardianContact: values.guardianContact === "" ? null : values.guardianContact,
      roomId: values.roomId === UNASSIGNED_ROOM_SENTINEL ? null : values.roomId,
      monthlyDiscountAmount: values.monthlyDiscountAmount ? Number(values.monthlyDiscountAmount) : null,
      advanceAmount: values.advanceAmount ? Number(values.advanceAmount) : null,
      advanceReceivedDate: values.advanceReceivedDate ? format(parseISO(values.advanceReceivedDate), 'yyyy-MM-dd') : null,
    };
    await onSubmit(processedValues);
  };

  const photoPreview = form.watch("photoUrl");
  const idProofPreview = form.watch("idProofUrl");
  const currentStatus = form.watch("status");

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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
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
                    <Textarea placeholder="e.g., Emergency contact, allergies, etc." {...field} value={field.value ?? ""} />
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
            <CardDescription>Upload resident's photo and ID proof. Max {MAX_FILE_SIZE_MB}MB per image.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resident Photo</FormLabel>
                  <FormControl>
                     <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "photoUrl")}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                  </FormControl>
                  {photoPreview ? (
                     <Image src={photoPreview} alt="Photo Preview" width={100} height={100} className="mt-2 rounded-md border object-cover" data-ai-hint="person portrait" />
                  ) : (
                    <div className="mt-2 w-24 h-24 bg-muted rounded-md flex flex-col items-center justify-center text-muted-foreground border border-dashed">
                        <UploadCloud className="h-8 w-8" />
                        <span className="text-xs">Upload Photo</span>
                    </div>
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
                  <FormLabel>ID Proof</FormLabel>
                  <FormControl>
                     <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "idProofUrl")}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                  </FormControl>
                   {idProofPreview ? (
                     <Image src={idProofPreview} alt="ID Proof Preview" width={200} height={120} className="mt-2 rounded-md border object-contain" data-ai-hint="document id" />
                  ) : (
                     <div className="mt-2 w-48 h-32 bg-muted rounded-md flex flex-col items-center justify-center text-muted-foreground border border-dashed">
                        <UploadCloud className="h-10 w-10" />
                        <span className="text-xs">Upload ID Proof</span>
                    </div>
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
                    <Input placeholder="e.g., Jane Doe" {...field} value={field.value || ""} />
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
                    <Input placeholder="e.g., 9876543211" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center"><FileText className="mr-2 h-5 w-5 text-primary"/>Status, Dates, Room & Financials</CardTitle>
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
                            {field.value && isValid(parseISO(field.value)) ? (
                              format(parseISO(field.value), "PPP")
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
                          selected={field.value ? parseISO(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
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
                            {field.value && isValid(parseISO(field.value)) ? (
                              format(parseISO(field.value), "PPP")
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
                          selected={field.value ? parseISO(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value as ResidentStatus);
                      if (value === 'former') {
                        form.setValue('roomId', null);
                        setUiSelectedFloor(SELECT_FLOOR_SENTINEL);
                      }
                    }}
                    value={field.value || (isEditing ? "active" : "upcoming")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {residentStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value} 
                                    disabled={isEditing && currentStatus === 'former' && status.value !== 'former' && status.value !== 'upcoming'}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
                <FormLabel>Select Floor</FormLabel>
                <Select
                    onValueChange={handleFloorSelect}
                    value={uiSelectedFloor}
                    disabled={form.getValues("status") === 'former'}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="-- Select a Floor --" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value={SELECT_FLOOR_SENTINEL}>-- Select a Floor --</SelectItem>
                    {floorOptions.map((floor) => (
                        <SelectItem key={floor.value} value={floor.value}>
                        {floor.label}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </FormItem>

            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Room</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === UNASSIGNED_ROOM_SENTINEL ? null : value);
                    }}
                    value={field.value === null || field.value === undefined ? UNASSIGNED_ROOM_SENTINEL : field.value}
                    disabled={form.getValues("status") === 'former' || uiSelectedFloor === SELECT_FLOOR_SENTINEL}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={uiSelectedFloor === SELECT_FLOOR_SENTINEL ? "Select a floor first" : "Select a room"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                       <SelectItem value={UNASSIGNED_ROOM_SENTINEL}>Unassigned</SelectItem>
                      {roomsOnSelectedFloor
                        .map((room) => (
                          <SelectItem key={room.id} value={room.id} 
                                      disabled={room.currentOccupancy >= room.capacity && room.id !== (defaultValues?.roomId || initialRoomId) }>
                            {room.roomNumber} (Occupancy: {room.currentOccupancy}/{room.capacity}) 
                            {room.currentOccupancy >= room.capacity && room.id !== (defaultValues?.roomId || initialRoomId) ? " - Full" : ""}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
             <FormLabel className="text-base font-semibold text-foreground">Financials</FormLabel>
             <FormField
              control={form.control}
              name="monthlyDiscountAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Discount Amount (₹) (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g., 500" 
                      {...field} 
                      value={field.value ?? ""}
                      onChange={e => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Enter the fixed discount amount to be applied monthly to this resident's rent.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="advanceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Advance Amount (₹) (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 10000" 
                        {...field} 
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>One-time advance/security deposit.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="advanceReceivedDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Advance Received Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!form.watch("advanceAmount")} // Disable if no advance amount
                          >
                            {field.value && isValid(parseISO(field.value)) ? (
                              format(parseISO(field.value), "PPP")
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
                          selected={field.value ? parseISO(field.value) : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
