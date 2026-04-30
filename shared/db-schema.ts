import { relations, sql } from "drizzle-orm";
import { integer, pgEnum, pgTable, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["hospital", "patient"]);
export const organTypeEnum = pgEnum("organ_type", ["Kidney", "Liver", "Heart", "Lungs", "Pancreas", "Cornea"]);
export const bloodGroupEnum = pgEnum("blood_group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
export const availabilityStatusEnum = pgEnum("availability_status", ["AVAILABLE", "UNAVAILABLE"]);
export const requestStatusEnum = pgEnum("request_status", ["PENDING", "ACCEPTED", "REJECTED"]);
export const urgencyLevelEnum = pgEnum("urgency_level", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull(),
    city: text("city").notNull(),
    phone: text("phone"),
    passwordSalt: text("password_salt").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
  }),
);

export const hospitals = pgTable(
  "hospitals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    city: text("city").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdUnique: uniqueIndex("hospitals_user_id_unique").on(table.userId),
  }),
);

export const organAvailability = pgTable(
  "organ_availability",
  {
    id: text("id").primaryKey(),
    hospitalId: text("hospital_id")
      .notNull()
      .references(() => hospitals.id, { onDelete: "cascade" }),
    organType: organTypeEnum("organ_type").notNull(),
    bloodGroup: bloodGroupEnum("blood_group").notNull(),
    quantity: integer("quantity").notNull().default(0),
    status: availabilityStatusEnum("status").notNull(),
    city: text("city").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    hospitalIdx: index("organ_availability_hospital_idx").on(table.hospitalId),
    lookupIdx: index("organ_availability_lookup_idx").on(table.city, table.organType, table.bloodGroup, table.status),
  }),
);

export const transplantRequests = pgTable(
  "transplant_requests",
  {
    id: text("id").primaryKey(),
    patientId: text("patient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hospitalId: text("hospital_id")
      .notNull()
      .references(() => hospitals.id, { onDelete: "cascade" }),
    organType: organTypeEnum("organ_type").notNull(),
    bloodGroup: bloodGroupEnum("blood_group").notNull(),
    status: requestStatusEnum("status").notNull().default("PENDING"),
    urgencyLevel: urgencyLevelEnum("urgency_level").notNull().default("MEDIUM"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    patientIdx: index("transplant_requests_patient_idx").on(table.patientId),
    hospitalIdx: index("transplant_requests_hospital_idx").on(table.hospitalId),
  }),
);

export const usersRelations = relations(users, ({ many, one }) => ({
  hospital: one(hospitals, {
    fields: [users.id],
    references: [hospitals.userId],
  }),
  patientRequests: many(transplantRequests),
}));

export const hospitalsRelations = relations(hospitals, ({ many, one }) => ({
  user: one(users, {
    fields: [hospitals.userId],
    references: [users.id],
  }),
  availability: many(organAvailability),
  requests: many(transplantRequests),
}));

export const availabilityRelations = relations(organAvailability, ({ one }) => ({
  hospital: one(hospitals, {
    fields: [organAvailability.hospitalId],
    references: [hospitals.id],
  }),
}));

export const transplantRequestsRelations = relations(transplantRequests, ({ one }) => ({
  patient: one(users, {
    fields: [transplantRequests.patientId],
    references: [users.id],
  }),
  hospital: one(hospitals, {
    fields: [transplantRequests.hospitalId],
    references: [hospitals.id],
  }),
}));

export const nowUtc = sql`timezone('utc', now())`;
