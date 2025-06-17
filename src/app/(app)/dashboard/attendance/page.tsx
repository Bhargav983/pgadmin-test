
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { RowSelectionState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { getAttendanceColumns } from "./attendance-columns";
import type { Resident, Room, AttendanceRecord, AttendanceFormValues, AttendanceStatus } from "@/lib/types";
import { AttendanceFormDialog } from "@/components/attendance-form-dialog";
import { BulkAttendanceUpdateDialog, type BulkAttendanceUpdateValues } from "@/components/bulk-attendance-update-dialog";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ClipboardCheck, Users } from "lucide-react";
import { format, startOfDay } from 'date-fns';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ATTENDANCE_STORAGE_KEY = 'pgAttendanceRecords';

const getStoredData = <T,>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  try {
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse localStorage data for key:", key, e);
    return [];
  }
};

const setStoredData = <T,>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export interface DisplayAttendanceRecord {
  residentId: string;
  residentName: string;
  roomNumber: string | null;
  date: string; 
  checkInTime: string | null;
  checkOutTime: string | null;
  status: AttendanceStatus;
  notes: string | null;
  resident: Resident;
  attendanceRecord?: AttendanceRecord; 
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [activeResidents, setActiveResidents] = useState<Resident[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [displayRecords, setDisplayRecords] = useState<DisplayAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAttendanceTarget, setEditingAttendanceTarget] = useState<{ resident: Resident, existingRecord?: AttendanceRecord } | null>(null);

  const [isBulkFormOpen, setIsBulkFormOpen] = useState(false);

  const { toast } = useToast();

  const fetchDataAndProcess = useCallback(() => {
    setIsLoading(true);
    const storedResidents = getStoredData<Resident>('pgResidents');
    const currentActiveResidents = storedResidents.filter(r => r.status === 'active');
    setActiveResidents(currentActiveResidents);

    const storedRooms = getStoredData<Room>('pgRooms');
    setAllRooms(storedRooms);

    const attendanceRecords = getStoredData<AttendanceRecord>(ATTENDANCE_STORAGE_KEY);
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');

    const recordsForTable: DisplayAttendanceRecord[] = currentActiveResidents.map(res => {
      const room = storedRooms.find(r => r.id === res.roomId);
      const existingRecord = attendanceRecords.find(ar => ar.residentId === res.id && ar.date === formattedSelectedDate);

      return {
        residentId: res.id,
        residentName: res.name,
        roomNumber: room?.roomNumber || 'N/A',
        date: formattedSelectedDate,
        checkInTime: existingRecord?.checkInTime || null,
        checkOutTime: existingRecord?.checkOutTime || null,
        status: existingRecord?.status || 'Pending',
        notes: existingRecord?.notes || null,
        resident: res,
        attendanceRecord: existingRecord,
      };
    });

    setDisplayRecords(recordsForTable.sort((a,b) => a.residentName.localeCompare(b.residentName)));
    setIsLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchDataAndProcess();
    const handleStorageChange = () => fetchDataAndProcess();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchDataAndProcess]);

  const handleOpenForm = (target: DisplayAttendanceRecord) => {
    setEditingAttendanceTarget({ resident: target.resident, existingRecord: target.attendanceRecord });
    setIsFormOpen(true);
  };

  const handleSaveAttendance = (values: AttendanceFormValues) => {
    if (!editingAttendanceTarget) return;

    const { resident } = editingAttendanceTarget;
    const room = allRooms.find(r => r.id === resident.roomId);
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
    const recordId = `${resident.id}-${formattedSelectedDate}`;

    let allAttendanceRecords = getStoredData<AttendanceRecord>(ATTENDANCE_STORAGE_KEY);
    const existingRecordIndex = allAttendanceRecords.findIndex(ar => ar.id === recordId);

    const newRecordData: AttendanceRecord = {
      id: recordId,
      residentId: resident.id,
      date: formattedSelectedDate,
      checkInTime: values.checkInTime || null,
      checkOutTime: values.checkOutTime || null,
      status: values.status,
      notes: values.notes || null,
      residentNameAtTime: resident.name,
      roomNumberAtTime: room?.roomNumber || null,
    };

    if (existingRecordIndex > -1) {
      allAttendanceRecords[existingRecordIndex] = newRecordData;
    } else {
      allAttendanceRecords.push(newRecordData);
    }

    setStoredData(ATTENDANCE_STORAGE_KEY, allAttendanceRecords);
    toast({ title: "Attendance Updated", description: `Attendance for ${resident.name} on ${formattedSelectedDate} saved.` });
    setIsFormOpen(false);
    setEditingAttendanceTarget(null);
    fetchDataAndProcess(); 
  };
  
  const columns = useMemo(() => getAttendanceColumns(handleOpenForm), [handleOpenForm]);

  const getSelectedDisplayRecords = useCallback(() => {
    return Object.keys(rowSelection)
      .filter(indexStr => rowSelection[indexStr])
      .map(indexStr => displayRecords[parseInt(indexStr)])
      .filter(Boolean); 
  }, [rowSelection, displayRecords]);

  const handleBulkUpdateRecords = (updates: Partial<BulkAttendanceUpdateValues>) => {
    const selectedRecords = getSelectedDisplayRecords();
    if (selectedRecords.length === 0) {
      toast({ title: "No Residents Selected", description: "Please select residents to update.", variant: "destructive" });
      return;
    }

    let allAttendanceRecords = getStoredData<AttendanceRecord>(ATTENDANCE_STORAGE_KEY);
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
    let updatedCount = 0;

    selectedRecords.forEach(displayRecord => {
      const recordId = `${displayRecord.residentId}-${formattedSelectedDate}`;
      const existingRecordIndex = allAttendanceRecords.findIndex(ar => ar.id === recordId);
      const room = allRooms.find(r => r.id === displayRecord.resident.roomId);

      const newRecordData: AttendanceRecord = {
        id: recordId,
        residentId: displayRecord.residentId,
        date: formattedSelectedDate,
        checkInTime: 'checkInTime' in updates ? (updates.checkInTime || null) : (existingRecordIndex > -1 ? allAttendanceRecords[existingRecordIndex].checkInTime : null),
        checkOutTime: 'checkOutTime' in updates ? (updates.checkOutTime || null) : (existingRecordIndex > -1 ? allAttendanceRecords[existingRecordIndex].checkOutTime : null),
        status: updates.status || (existingRecordIndex > -1 ? allAttendanceRecords[existingRecordIndex].status : 'Pending'),
        notes: 'notes' in updates ? (updates.notes || null) : (existingRecordIndex > -1 ? allAttendanceRecords[existingRecordIndex].notes : null),
        residentNameAtTime: displayRecord.residentName,
        roomNumberAtTime: room?.roomNumber || null,
      };
      
      if (existingRecordIndex > -1) {
        allAttendanceRecords[existingRecordIndex] = newRecordData;
      } else {
        allAttendanceRecords.push(newRecordData);
      }
      updatedCount++;
    });

    setStoredData(ATTENDANCE_STORAGE_KEY, allAttendanceRecords);
    toast({ title: "Bulk Update Successful", description: `Updated attendance for ${updatedCount} resident(s).` });
    fetchDataAndProcess(); 
    setRowSelection({}); 
    setIsBulkFormOpen(false);
  };


  const selectedCount = getSelectedDisplayRecords().length;

  return (
    <div className="container mx-auto py-6 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-headline font-semibold flex items-center">
            <ClipboardCheck className="mr-3 h-8 w-8 text-primary" /> Daily Attendance
        </h1>
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Select Date:</span>
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                        if (date) setSelectedDate(startOfDay(date));
                    }}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="font-headline">Attendance for {format(selectedDate, 'PPP')}</CardTitle>
              <CardDescription>Log and view check-in/check-out times and status for active residents.</CardDescription>
            </div>
            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{selectedCount} selected</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Bulk Actions <Users className="ml-2 h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Apply to Selected</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleBulkUpdateRecords({ status: 'Present', checkInTime: format(new Date(), 'HH:mm') })}>
                      Mark Present (Now)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkUpdateRecords({ status: 'Absent', checkInTime: null, checkOutTime: null })}>
                      Mark Absent
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={() => handleBulkUpdateRecords({ status: 'On Leave', checkInTime: null, checkOutTime: null })}>
                      Mark On Leave
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsBulkFormOpen(true)}>
                      Update Times/Status/Notes...
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          ) : displayRecords.length > 0 ? (
            <DataTable 
              columns={columns} 
              data={displayRecords} 
              filterColumn="residentName" 
              filterInputPlaceholder="Filter by resident name..."
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              enableRowSelection={true} 
            />
          ) : (
            <p className="text-muted-foreground text-center py-8">No active residents found to display attendance for.</p>
          )}
        </CardContent>
      </Card>
      
      {editingAttendanceTarget && (
        <AttendanceFormDialog
          isOpen={isFormOpen}
          onClose={() => { setIsFormOpen(false); setEditingAttendanceTarget(null); }}
          onSubmit={handleSaveAttendance}
          residentName={editingAttendanceTarget.resident.name}
          currentDate={format(selectedDate, 'yyyy-MM-dd')}
          defaultValues={
            editingAttendanceTarget.existingRecord 
            ? { 
                checkInTime: editingAttendanceTarget.existingRecord.checkInTime, 
                checkOutTime: editingAttendanceTarget.existingRecord.checkOutTime,
                status: editingAttendanceTarget.existingRecord.status,
                notes: editingAttendanceTarget.existingRecord.notes
              }
            : { status: 'Pending', checkInTime: null, checkOutTime: null, notes: null }
          }
        />
      )}
      {isBulkFormOpen && selectedCount > 0 && (
        <BulkAttendanceUpdateDialog
          isOpen={isBulkFormOpen}
          onClose={() => setIsBulkFormOpen(false)}
          onSubmit={handleBulkUpdateRecords}
          numSelected={selectedCount}
          currentDate={format(selectedDate, 'yyyy-MM-dd')}
        />
      )}
    </div>
  );
}
