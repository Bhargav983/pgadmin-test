
import type { z } from 'zod';
import type { EmailConfigSchema } from './schemas';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer';
export type PaymentStatus = 'Paid' | 'Due' | 'Overdue' | 'Partial';
export type ResidentStatus = 'active' | 'upcoming' | 'former';

export type ActivityType =
  | 'RESIDENT_CREATED'
  | 'DETAILS_UPDATED'
  | 'ROOM_ASSIGNED'
  | 'PAYMENT_RECORDED'
  | 'ROOM_TRANSFERRED'
  | 'VACATED'
  | 'ACTIVATED'
  | 'REACTIVATED';

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO Date string
  type: ActivityType;
  description: string;
  details?: Record<string, any>;
}

export interface Payment {
  id: string; // Unique ID for the payment transaction
  receiptId?: string; // Unique ID for the generated receipt
  month: number; // 1-12
  year: number;
  amount: number;
  date: string; // ISO string format for date
  mode: PaymentMode;
  roomId: string; // ID of the room for which payment was made at the time of payment
  notes?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  rent: number;
  currentOccupancy: number; // Represents active or upcoming residents in the room
}

export interface Resident {
  id:string;
  name: string;
  contact: string;
  enquiryDate?: string | null;
  joiningDate?: string | null;
  personalInfo?: string;
  roomId: string | null;
  status: ResidentStatus;
  payments: Payment[];
  activityLog: ActivityLogEntry[];
  photoUrl?: string | null;
  idProofUrl?: string | null;
  guardianName?: string | null;
  guardianContact?: string | null;
}

export type AttendanceStatus = 'Pending' | 'Present' | 'Late' | 'Absent' | 'On Leave';

export interface AttendanceRecord {
  id: string; // Unique ID for the attendance entry: e.g., residentId-YYYY-MM-DD
  residentId: string;
  date: string; // YYYY-MM-DD format
  checkInTime: string | null; // Store as HH:mm or full ISO if needed
  checkOutTime: string | null; // Store as HH:mm or full ISO
  status: AttendanceStatus;
  notes: string | null;
  // Denormalized data for easier display, captured at the time of record creation/update
  residentNameAtTime: string;
  roomNumberAtTime: string | null;
}

export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export const complaintCategories = ["Electricity", "Water", "Wi-Fi", "Plumbing", "Cleaning", "Noise", "Security", "Other"] as const;
export type ComplaintCategory = typeof complaintCategories[number];


export interface Complaint {
  id: string;
  residentId: string;
  residentName: string; // Denormalized for display
  roomNumber: string; // Denormalized for display
  category: ComplaintCategory | string; // Allow 'Other' as custom string
  description: string;
  dateReported: string; // ISO Date string
  status: ComplaintStatus;
  resolutionNotes?: string | null;
  dateResolved?: string | null; // ISO Date string
}

export type RoomFormValues = Omit<Room, 'id' | 'currentOccupancy'>;
export type ResidentFormValues = Omit<Resident, 'id' | 'payments' | 'activityLog'>;
export type PaymentFormValues = Omit<Payment, 'id' | 'roomId' | 'receiptId'>;
export type AttendanceFormValues = Omit<AttendanceRecord, 'id' | 'residentId' | 'date' | 'residentNameAtTime' | 'roomNumberAtTime'>;
export type EmailConfigFormValues = z.infer<typeof EmailConfigSchema>;
export type ComplaintFormValues = {
  residentId: string;
  category: ComplaintCategory | string;
  customCategory?: string; // For when category is 'Other'
  description: string;
  status: ComplaintStatus; // Usually 'Open' on creation, but editable
  resolutionNotes?: string | null;
};
// For display in table, includes denormalized data
export interface DisplayComplaint extends Complaint {}


// For receipt display
export interface ReceiptData {
  payment: Payment;
  residentName: string;
  roomNumber: string;
  pgName?: string; // Optional, can be defaulted
}

