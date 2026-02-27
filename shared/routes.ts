import { z } from "zod";
import { donorSchema, recipientRequestSchema, matchResultSchema } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  donors: {
    list: {
      method: "GET" as const,
      path: "/api/donors" as const,
      responses: {
        200: z.array(donorSchema),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/donors" as const,
      input: donorSchema.omit({ id: true }),
      responses: {
        201: donorSchema,
        400: errorSchemas.validation,
      },
    },
  },
  match: {
    find: {
      method: "POST" as const,
      path: "/api/match" as const,
      input: recipientRequestSchema,
      responses: {
        200: z.array(matchResultSchema),
        400: errorSchemas.validation,
      },
    },
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
