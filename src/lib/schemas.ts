
import { z } from 'zod';
import { complaintCategories, enquiryStatuses } from './types';
import type { RecipientType, ManagedUserRole, ManagedUserStatus } from './types';

export const RoomSchema = z.object({
  roomNumber: z.string().min(1, { message: "Room number is required." }),
  capacity: z.coerce.number().int().min(1, { message: "Capacity must be at least 1." }),
  rent: z.coerce.number().min(0, { message: "Rent must be a non-negative number." }),
  floorNumber: z.coerce.number().int().min(0, { message: "Floor number must be 0 or greater (e.g., 0 for Ground Floor)." }),
  facilities: z.string().optional(),
});

export const ResidentStatusSchema = z.enum(['active', 'upcoming', 'former']);

const UNASSIGNED_ROOM_SENTINEL = "__UNASSIGNED_ROOM_SENTINEL__";

export const ResidentSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  contact: z.string().min(1, { message: "Contact information is required." }),
  enquiryDate: z.string().nullable().optional().refine(val => val === null || val === undefined || val === "" || !isNaN(Date.parse(val)), {
    message: "Invalid enquiry date.",
  }),
  joiningDate: z.string().nullable().optional().refine(val => val === null || val === undefined || val === "" || !isNaN(Date.parse(val)), {
    message: "Invalid joining date.",
  }),
  personalInfo: z.string().optional(),
  roomId: z.string().nullable().optional().or(z.literal(UNASSIGNED_ROOM_SENTINEL).transform(() => null)),
  status: ResidentStatusSchema,
  photoUrl: z.string().startsWith("data:image/", { message: "Invalid image Data URI." }).max(5 * 1024 * 1024, { message: "Photo image too large (max 5MB)." }).nullable().optional(),
  idProofUrl: z.string().startsWith("data:image/", { message: "Invalid image Data URI." }).max(5 * 1024 * 1024, { message: "ID proof image too large (max 5MB)." }).nullable().optional(),
  guardianName: z.string().nullable().optional(),
  guardianContact: z.string().nullable().optional(),
  monthlyDiscountAmount: z.coerce.number().nonnegative({ message: "Discount must be a non-negative number."}).nullable().optional(),
  advanceAmount: z.coerce.number().nonnegative({ message: "Advance amount must be a non-negative number." }).nullable().optional(),
  advanceReceivedDate: z.string().nullable().optional().refine(val => val === null || val === undefined || val === "" || !isNaN(Date.parse(val)), {
    message: "Invalid advance received date.",
  }),
}).superRefine((data, ctx) => {
  if (data.status === 'active' && data.roomId === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Active residents must be assigned to a room.",
      path: ["roomId"],
    });
  }
  if (data.joiningDate && data.enquiryDate && new Date(data.joiningDate) < new Date(data.enquiryDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Joining date cannot be earlier than enquiry date.",
      path: ["joiningDate"],
    });
  }
  if (data.guardianContact && !/^\d{10}$/.test(data.guardianContact) && data.guardianContact.trim() !== "") {
    ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Guardian contact must be a valid 10-digit phone number or empty.",
        path: ["guardianContact"],
    });
  }
  if (data.advanceAmount && !data.advanceReceivedDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Advance received date is required if advance amount is provided.",
      path: ["advanceReceivedDate"],
    });
  }
  if (!data.advanceAmount && data.advanceReceivedDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Advance amount is required if advance received date is provided.",
      path: ["advanceAmount"],
    });
  }
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

// Super Admin Login Schema
export const SuperAdminLoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export const ManagedUserRoleSchema = z.enum(['Admin', 'Manager']);
export const ManagedUserStatusSchema = z.enum(['active', 'inactive']);

export const ManagedUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100),
  email: z.string().email("Invalid email address."),
  role: ManagedUserRoleSchema,
  status: ManagedUserStatusSchema,
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

export const AttendanceStatusSchema = z.enum(['Pending', 'Present', 'Late', 'Absent', 'On Leave']);

export const AttendanceFormValidationSchema = z.object({
  checkInTime: z.string().nullable().optional()
    .refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), { message: "Invalid check-in time format (HH:MM)." }),
  checkOutTime: z.string().nullable().optional()
    .refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), { message: "Invalid check-out time format (HH:MM)." }),
  status: AttendanceStatusSchema,
  notes: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.checkInTime && data.checkOutTime && data.checkOutTime < data.checkInTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Check-out time cannot be earlier than check-in time.",
      path: ["checkOutTime"],
    });
  }
  if ((data.status === 'Present' || data.status === 'Late') && !data.checkInTime) {
     ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Check-in time is required for 'Present' or 'Late' status.",
      path: ["checkInTime"],
    });
  }
});

export const EmailConfigSchema = z.object({
  emailBackend: z.string().optional(),
  emailHost: z.string().min(1, "Email host is required."),
  emailPort: z.coerce.number().int().min(1, "Port must be a positive integer.").max(65535, "Port number is too high."),
  emailUseTls: z.boolean().default(true),
  emailHostUser: z.string().email("Invalid email address for host user.").min(1, "Email host user is required."),
  emailHostPassword: z.string().min(1, "Email host password is required."),
  defaultFromEmail: z.string().email("Invalid default from email address.").min(1, "Default from email is required."),
});

export const ComplaintStatusSchema = z.enum(['Open', 'In Progress', 'Resolved', 'Closed']);
const ComplaintCategoryEnum = z.enum(complaintCategories);

export const ComplaintSchema = z.object({
  residentId: z.string().min(1, "Resident selection is required."),
  category: z.string().min(1, "Category is required."), 
  customCategory: z.string().optional(),
  description: z.string().min(3, "Description must be at least 3 characters long."),
  status: ComplaintStatusSchema.default('Open'),
  resolutionNotes: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.category === "Other" && (!data.customCategory || data.customCategory.trim() === "")) {
    ctx.addIssue({
      path: ["customCategory"],
      message: "Please specify the category if 'Other' is selected.",
      code: z.ZodIssueCode.custom,
    });
  }
  if (data.status === 'Resolved' || data.status === 'Closed') {
    if (!data.resolutionNotes || data.resolutionNotes.trim().length < 3) {
      ctx.addIssue({
        path: ["resolutionNotes"],
        message: "Resolution notes (at least 3 characters) are required when status is Resolved or Closed.",
        code: z.ZodIssueCode.custom,
      });
    }
  }
});

export const AnnouncementSchema = z.object({
  recipientType: z.enum(['all', 'specific', 'selected'] as [RecipientType, ...RecipientType[]]),
  specificResidentId: z.string().optional(),
  selectedResidentIds: z.array(z.string()).optional(),
  subject: z.string().min(1, "Subject is required."),
  body: z.string().min(1, "Email body is required."),
}).superRefine((data, ctx) => {
  if (data.recipientType === 'specific' && !data.specificResidentId) {
    ctx.addIssue({
      path: ['specificResidentId'],
      message: 'Please select a specific resident.',
      code: z.ZodIssueCode.custom,
    });
  }
  if (data.recipientType === 'selected' && (!data.selectedResidentIds || data.selectedResidentIds.length === 0)) {
    ctx.addIssue({
      path: ['selectedResidentIds'],
      message: 'Please select at least one resident.',
      code: z.ZodIssueCode.custom,
    });
  }
});

export const VacateResidentSchema = z.object({
    reasonForLeaving: z.string().min(1, { message: "Reason for leaving is required." }),
    confirmNoDues: z.boolean().refine(val => val === true, { message: "You must confirm no dues are pending."}),
    confirmNoClaims: z.boolean().refine(val => val === true, { message: "You must confirm no claims/damages."}),
});

export const EnquiryStatusZodEnum = z.enum(enquiryStatuses);

export const EnquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name is too long."),
  contact: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid contact number format. Include country code if needed (e.g., +91XXXXXXXXXX or XXXXXXXXXX)."),
  email: z.string().email("Invalid email address.").nullable().optional().or(z.literal("")),
  enquiryDate: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Valid enquiry date is required." }),
  status: EnquiryStatusZodEnum.default('New'),
  notes: z.string().max(500, "Notes are too long.").nullable().optional(),
  nextFollowUpDate: z.string().nullable().optional().refine(val => val === null || val === undefined || val === "" || !isNaN(Date.parse(val)), {
    message: "Invalid next follow-up date.",
  }),
}).superRefine((data, ctx) => {
  if (data.nextFollowUpDate && data.enquiryDate && new Date(data.nextFollowUpDate) < new Date(data.enquiryDate)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Next follow-up date cannot be earlier than enquiry date.",
      path: ["nextFollowUpDate"],
    });
  }
});

export const ProfileInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(50, "Name is too long."),
  email: z.string().email("Invalid email address."),
  photoUrl: z.string().startsWith("data:image/", { message: "Invalid image Data URI." }).max(2 * 1024 * 1024, { message: "Photo image too large (max 2MB)." }).nullable().optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});
