import { z } from 'zod';

export const RoomSchema = z.object({
  roomNumber: z.string().min(1, { message: "Room number is required." }),
  capacity: z.coerce.number().int().min(1, { message: "Capacity must be at least 1." }),
  rent: z.coerce.number().min(0, { message: "Rent must be a positive number." }),
});

export const ResidentSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  contact: z.string().min(1, { message: "Contact information is required." }),
  personalInfo: z.string().optional(),
  roomId: z.string().nullable().refine(val => val !== '', { message: "Room assignment is required."}),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});
