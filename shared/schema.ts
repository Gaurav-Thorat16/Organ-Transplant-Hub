import { z } from "zod";

export const userRoleSchema = z.enum(["hospital", "patient"]);

export type UserRole = z.infer<typeof userRoleSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: userRoleSchema,
  city: z.string().min(1, "City is required"),
  phone: z.string().optional(),
  createdAt: z.string(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const authSignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: userRoleSchema,
  city: z.string().min(1, "City is required"),
  phone: z.string().optional(),
});

export type AuthSignupInput = z.infer<typeof authSignupSchema>;

export const authLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export type AuthLoginInput = z.infer<typeof authLoginSchema>;

export const organTypeSchema = z.enum([
  "Kidney",
  "Liver",
  "Heart",
  "Lungs",
  "Pancreas",
  "Cornea",
]);

export type OrganType = z.infer<typeof organTypeSchema>;

export const bloodGroupSchema = z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

export type BloodGroup = z.infer<typeof bloodGroupSchema>;

export const organAvailabilityStatusSchema = z.enum(["AVAILABLE", "UNAVAILABLE"]);

export const hospitalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  city: z.string(),
  createdAt: z.string(),
});

export type Hospital = z.infer<typeof hospitalSchema>;

export const organAvailabilitySchema = z.object({
  id: z.string(),
  hospitalId: z.string(),
  organType: organTypeSchema,
  bloodGroup: bloodGroupSchema,
  quantity: z.number().int().min(0),
  status: organAvailabilityStatusSchema,
  city: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type OrganAvailability = z.infer<typeof organAvailabilitySchema>;

export const createOrganAvailabilitySchema = z.object({
  organType: organTypeSchema,
  bloodGroup: bloodGroupSchema,
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  city: z.string().min(1, "City is required"),
});

export type CreateOrganAvailability = z.infer<typeof createOrganAvailabilitySchema>;

export const reduceAvailabilitySchema = z.object({
  amount: z.coerce.number().int().min(1, "Amount must be at least 1"),
});

export type ReduceAvailability = z.infer<typeof reduceAvailabilitySchema>;

export const urgencyLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export type UrgencyLevel = z.infer<typeof urgencyLevelSchema>;

export const patientSearchSchema = z.object({
  city: z.string().min(1, "City is required"),
  organType: organTypeSchema,
  bloodGroup: bloodGroupSchema,
  useCompatibility: z.boolean().optional(),
  urgencyLevel: urgencyLevelSchema.optional(),
});

export type PatientSearchInput = z.infer<typeof patientSearchSchema>;

export const hospitalAvailabilityViewSchema = z.object({
  availabilityId: z.string(),
  hospitalId: z.string(),
  hospitalName: z.string(),
  city: z.string(),
  organType: organTypeSchema,
  bloodGroup: bloodGroupSchema,
  quantity: z.number().int().min(0),
  status: organAvailabilityStatusSchema,
  priorityScore: z.number().optional(),
  isCompatible: z.boolean().optional(),
});

export type HospitalAvailabilityView = z.infer<typeof hospitalAvailabilityViewSchema>;

export const requestStatusSchema = z.enum(["PENDING", "ACCEPTED", "REJECTED"]);

export const transplantRequestSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  patientCity: z.string(),
  hospitalId: z.string(),
  hospitalName: z.string(),
  organType: organTypeSchema,
  bloodGroup: bloodGroupSchema,
  status: requestStatusSchema,
  urgencyLevel: urgencyLevelSchema,
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TransplantRequest = z.infer<typeof transplantRequestSchema>;

export const createTransplantRequestSchema = z.object({
  hospitalId: z.string().min(1, "Hospital id is required"),
  organType: organTypeSchema,
  bloodGroup: bloodGroupSchema,
  urgencyLevel: urgencyLevelSchema.optional(),
  notes: z.string().max(500).optional(),
});

export type CreateTransplantRequest = z.infer<typeof createTransplantRequestSchema>;

export const updateRequestStatusSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED"]),
});

export const statsSchema = z.object({
  totalAvailableOrgans: z.number(),
  totalHospitals: z.number(),
  totalRequests: z.number(),
  pendingRequests: z.number(),
  acceptedRequests: z.number(),
  rejectedRequests: z.number(),
  organBreakdown: z.record(z.number()),
  bloodGroupBreakdown: z.record(z.number()),
});

export type Stats = z.infer<typeof statsSchema>;
