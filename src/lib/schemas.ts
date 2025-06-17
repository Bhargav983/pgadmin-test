
import { z } from 'zod';

export const RoomSchema = z.object({
  roomNumber: z.string().min(1, { message: "Room number is required." }),
  capacity: z.coerce.number().int().min(1, { message: "Capacity must be at least 1." }),
  rent: z.coerce.number().min(0, { message: "Rent must be a positive number." }),
});

export const ResidentStatusSchema = z.enum(['active', 'upcoming', 'former']);

export const ResidentSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  contact: z.string().min(1, { message: "Contact information is required." }),
  personalInfo: z.string().optional(),
  roomId: z.string().nullable(), // Allow null, specific validation below
  status: ResidentStatusSchema,
  // payments array is managed internally, not part of this form schema
}).superRefine((data, ctx) => {
  if (data.status === 'active' && !data.roomId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Active residents must be assigned to a room.",
      path: ["roomId"], // Point error to roomId field
    });
  }
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const PaymentModeSchema = z.enum(['Cash', 'UPI', 'Bank Transfer']);

export const PaymentSchema = z.object({
  month: z.coerce.number().int().min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12"),
  year: z.coerce.number().int().min(new Date().getFullYear() - 10, "Year seems too old").max(new Date().getFullYear() + 1, "Year seems too far in future"),
  amount: z.coerce.number().min(0.01, { message: "Amount must be greater than 0." }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid payment date." }), 
  mode: PaymentModeSchema,
  notes: z.string().optional(),
});

