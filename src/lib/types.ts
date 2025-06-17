
export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer';
export type PaymentStatus = 'Paid' | 'Due' | 'Overdue' | 'Partial';
export type ResidentStatus = 'active' | 'upcoming' | 'former';

export interface Payment {
  id: string; // Unique ID for the payment transaction
  receiptId?: string; // Unique ID for the generated receipt
  month: number; // 1-12
  year: number;
  amount: number;
  date: string; // ISO string format for date
  mode: PaymentMode;
  roomId: string; // ID of the room for which payment was made
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
  id: string;
  name: string;
  contact: string;
  personalInfo?: string;
  roomId: string | null; // ID of the room they are assigned to
  status: ResidentStatus; // 'active', 'upcoming', or 'former'
  payments: Payment[];
}

export type RoomFormValues = Omit<Room, 'id' | 'currentOccupancy'>;
export type ResidentFormValues = Omit<Resident, 'id' | 'payments'>;
export type PaymentFormValues = Omit<Payment, 'id' | 'roomId' | 'receiptId'>;

// For receipt display
export interface ReceiptData {
  payment: Payment;
  residentName: string;
  roomNumber: string;
  pgName?: string; // Optional, can be defaulted
}
