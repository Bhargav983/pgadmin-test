
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
  | 'REACTIVATED'
  | 'ENQUIRY_CONVERTED';

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO Date string
  type: ActivityType;
  description: string;
  details?: Record<string, any> & {
    reasonForLeaving?: string;
    duesClearedConfirmed?: boolean;
    noClaimsConfirmed?: boolean;
    vacatedFromRoomId?: string | null;
    vacatedFromRoomNumber?: string;
    convertedFromEnquiryId?: string;
  };
}

export interface Payment {
  id: string;
  receiptId?: string;
  month: number;
  year: number;
  amount: number;
  date: string;
  mode: PaymentMode;
  roomId: string;
  notes?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  rent: number;
  currentOccupancy: number;
  floorNumber: number;
  facilities?: string[];
}

export interface Resident {
  id:string;
  name: string;
  email: string;
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
  monthlyDiscountAmount?: number | null;
  advanceAmount?: number | null;
  advanceReceivedDate?: string | null;
}

export type AttendanceStatus = 'Pending' | 'Present' | 'Late' | 'Absent' | 'On Leave';

export interface AttendanceRecord {
  id: string;
  residentId: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: AttendanceStatus;
  notes: string | null;
  residentNameAtTime: string;
  roomNumberAtTime: string | null;
}

export type ComplaintStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export const complaintCategories = ["Electricity", "Water", "Wi-Fi", "Plumbing", "Cleaning", "Noise", "Security", "Other"] as const;
export type ComplaintCategory = typeof complaintCategories[number];


export interface Complaint {
  id: string;
  residentId: string;
  residentName: string;
  roomNumber: string;
  category: ComplaintCategory | string;
  description: string;
  dateReported: string;
  status: ComplaintStatus;
  resolutionNotes?: string | null;
  dateResolved?: string | null;
}

export interface Holiday {
  id: string;
  date: string;
  reason: string;
}

export interface ImportantContact {
  id: string;
  service: string;
  name?: string;
  contactNumber: string;
}

export type EnquiryStatus = 'New' | 'Follow-up' | 'Converted' | 'Closed';
export const enquiryStatuses: EnquiryStatus[] = ['New', 'Follow-up', 'Converted', 'Closed'];

export interface Enquiry {
  id: string;
  name: string;
  contact: string;
  email?: string | null;
  enquiryDate: string;
  status: EnquiryStatus;
  notes?: string | null;
  nextFollowUpDate?: string | null;
}

export type RoomFormValues = {
  roomNumber: string;
  capacity: number;
  rent: number;
  floorNumber: number;
  facilities?: string;
};

export type ResidentFormValues = Omit<Resident, 'id' | 'payments' | 'activityLog'>;
export type PaymentFormValues = Omit<Payment, 'id' | 'roomId' | 'receiptId'>;
export type AttendanceFormValues = Omit<AttendanceRecord, 'id' | 'residentId' | 'date' | 'residentNameAtTime' | 'roomNumberAtTime'>;
export type EmailConfigFormValues = z.infer<typeof EmailConfigSchema>;
export type ComplaintFormValues = {
  residentId: string;
  category: ComplaintCategory | string;
  customCategory?: string;
  description: string;
  status: ComplaintStatus;
  resolutionNotes?: string | null;
};

export interface DisplayComplaint extends Complaint {}
export type EnquiryFormValues = Omit<Enquiry, 'id'>;

export interface ReceiptData {
  payment: Payment;
  residentName: string;
  roomNumber: string;
  floorNumber?: number;
  pgName?: string;
}

export type RecipientType = 'all' | 'specific' | 'selected';

export interface AnnouncementFormValues {
  recipientType: RecipientType;
  specificResidentId?: string;
  selectedResidentIds?: string[];
  subject: string;
  body: string;
}

export interface VacateResidentFormValues {
    reasonForLeaving: string;
    confirmNoDues: boolean;
    confirmNoClaims: boolean;
}

export interface ProfileInfoFormValues {
  name: string;
  email: string;
  photoUrl?: string | null;
}

export interface ChangePasswordFormValues {
  currentPassword?: string;
  newPassword: string;
  confirmNewPassword: string;
}

// Super Admin - User Management
export type ManagedUserRole = 'Admin' | 'Manager';
export type ManagedUserStatus = 'active' | 'inactive';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: ManagedUserRole;
  status: ManagedUserStatus;
  // Password is not stored/managed in this iteration for simplicity
}

export type ManagedUserFormValues = Omit<ManagedUser, 'id'>;
