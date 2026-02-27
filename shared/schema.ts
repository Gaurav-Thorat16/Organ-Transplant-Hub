import { z } from "zod";

export const donorSchema = z.object({
  id: z.string().optional(),
  hospitalName: z.string().min(1, "Hospital name is required"),
  organType: z.string().min(1, "Organ type is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  viabilityTime: z.coerce.number().min(1, "Viability time must be at least 1 hour"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export type Donor = z.infer<typeof donorSchema>;

export const recipientRequestSchema = z.object({
  organType: z.string().min(1, "Organ type is required"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  urgencyLevel: z.coerce.number().min(1).max(10), // 1-10 scale
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  topK: z.coerce.number().min(1).max(50).default(5),
});

export type RecipientRequest = z.infer<typeof recipientRequestSchema>;

export const matchResultSchema = z.object({
  rank: z.number(),
  donorId: z.string(),
  hospitalName: z.string(),
  organDetails: z.string(),
  viabilityTime: z.number(),
  priorityScore: z.number(),
  distance: z.number(), // in km
});

export type MatchResult = z.infer<typeof matchResultSchema>;
