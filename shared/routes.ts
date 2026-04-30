import { z } from "zod";
import {
  authUserSchema,
  authSignupSchema,
  authLoginSchema,
  hospitalSchema,
  organAvailabilitySchema,
  createOrganAvailabilitySchema,
  reduceAvailabilitySchema,
  patientSearchSchema,
  hospitalAvailabilityViewSchema,
  transplantRequestSchema,
  createTransplantRequestSchema,
  updateRequestStatusSchema,
  statsSchema,
} from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    signup: { method: "POST" as const, path: "/api/auth/signup" as const, input: authSignupSchema, responses: { 201: authUserSchema, 400: errorSchemas.validation } },
    login: { method: "POST" as const, path: "/api/auth/login" as const, input: authLoginSchema, responses: { 200: authUserSchema, 400: errorSchemas.validation } },
    me: { method: "GET" as const, path: "/api/auth/me" as const, responses: { 200: authUserSchema, 401: errorSchemas.internal } },
    logout: { method: "POST" as const, path: "/api/auth/logout" as const, responses: { 200: z.object({ message: z.string() }) } },
  },
  hospitals: {
    mine: { method: "GET" as const, path: "/api/hospitals/mine" as const, responses: { 200: hospitalSchema } },
    availabilityList: { method: "GET" as const, path: "/api/hospitals/availability" as const, responses: { 200: z.array(organAvailabilitySchema) } },
    createAvailability: { method: "POST" as const, path: "/api/hospitals/availability" as const, input: createOrganAvailabilitySchema, responses: { 201: organAvailabilitySchema, 400: errorSchemas.validation } },
    deleteAvailability: { method: "DELETE" as const, path: "/api/hospitals/availability/:availabilityId" as const, responses: { 200: z.object({ message: z.string() }), 400: errorSchemas.validation } },
    reduceAvailability: { method: "POST" as const, path: "/api/hospitals/availability/:availabilityId/reduce" as const, input: reduceAvailabilitySchema, responses: { 200: organAvailabilitySchema, 400: errorSchemas.validation } },
  },
  patients: {
    searchAvailability: { method: "POST" as const, path: "/api/patients/search" as const, input: patientSearchSchema, responses: { 200: z.array(hospitalAvailabilityViewSchema), 400: errorSchemas.validation } },
  },
  requests: {
    create: { method: "POST" as const, path: "/api/requests" as const, input: createTransplantRequestSchema, responses: { 201: transplantRequestSchema, 400: errorSchemas.validation } },
    mine: { method: "GET" as const, path: "/api/requests/mine" as const, responses: { 200: z.array(transplantRequestSchema) } },
    incoming: { method: "GET" as const, path: "/api/requests/incoming" as const, responses: { 200: z.array(transplantRequestSchema) } },
    updateStatus: { method: "POST" as const, path: "/api/requests/:requestId/status" as const, input: updateRequestStatusSchema, responses: { 200: transplantRequestSchema, 400: errorSchemas.validation } },
  },
  stats: {
    overview: { method: "GET" as const, path: "/api/stats" as const, responses: { 200: statsSchema } },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
