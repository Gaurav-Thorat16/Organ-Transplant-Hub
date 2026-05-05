import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { createHash, randomUUID } from "crypto";
import {
  hospitals,
  organAvailability,
  transplantRequests,
  users,
} from "@shared/db-schema";
import type {
  AuthLoginInput,
  AuthSignupInput,
  BloodGroup,
  AuthUser,
  CreateOrganAvailability,
  Hospital,
  HospitalAvailabilityView,
  OrganAvailability,
  OrganType,
  PatientSearchInput,
  TransplantRequest,
  UrgencyLevel,
  Stats,
} from "@shared/schema";
import { db } from "./db";

// Blood compatibility map: key = recipient, value = compatible donors
const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

const URGENCY_SCORE: Record<string, number> = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toAuthUser(row: typeof users.$inferSelect): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    city: row.city,
    phone: row.phone ?? undefined,
    createdAt: toIso(row.createdAt),
  };
}

function toHospital(row: typeof hospitals.$inferSelect): Hospital {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    city: row.city,
    createdAt: toIso(row.createdAt),
  };
}

function toAvailability(row: typeof organAvailability.$inferSelect): OrganAvailability {
  return {
    id: row.id,
    hospitalId: row.hospitalId,
    organType: row.organType,
    bloodGroup: row.bloodGroup,
    quantity: row.quantity,
    status: row.status,
    city: row.city,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export interface IStorage {
  createUser(input: AuthSignupInput): Promise<AuthUser>;
  authenticateUser(input: AuthLoginInput): Promise<AuthUser | null>;
  getUserById(id: string): Promise<AuthUser | undefined>;

  getHospitalForUser(userId: string): Promise<Hospital | undefined>;
  getHospitalAvailability(userId: string): Promise<OrganAvailability[]>;
  addHospitalAvailability(userId: string, input: CreateOrganAvailability): Promise<OrganAvailability>;
  deleteHospitalAvailability(userId: string, availabilityId: string): Promise<void>;
  reduceHospitalAvailability(userId: string, availabilityId: string, amount: number): Promise<OrganAvailability>;

  searchAvailabilityForPatient(input: PatientSearchInput): Promise<HospitalAvailabilityView[]>;

  createRequest(patientUserId: string, hospitalId: string, organType: OrganType, bloodGroup: BloodGroup, urgencyLevel?: UrgencyLevel, notes?: string): Promise<TransplantRequest>;
  getPatientRequests(patientUserId: string): Promise<TransplantRequest[]>;
  getHospitalRequests(hospitalUserId: string): Promise<TransplantRequest[]>;
  updateRequestStatus(hospitalUserId: string, requestId: string, status: "ACCEPTED" | "REJECTED"): Promise<TransplantRequest>;

  getStats(): Promise<Stats>;
}

export class PostgresStorage implements IStorage {
  private readonly initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.seedIfEmpty();
  }

  private hashPassword(password: string, salt: string = randomUUID()) {
    const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
    return { salt, hash };
  }

  private async ensureInitialized() {
    await this.initPromise;
  }

  private async getHospitalOrThrow(userId: string) {
    const [hospital] = await db
      .select()
      .from(hospitals)
      .where(eq(hospitals.userId, userId))
      .limit(1);

    if (!hospital) throw new Error("Hospital account not found");
    return hospital;
  }

  private mapRequestRow(row: {
    request: typeof transplantRequests.$inferSelect;
    patientName: string;
    patientCity: string;
    hospitalName: string;
  }): TransplantRequest {
    return {
      id: row.request.id,
      patientId: row.request.patientId,
      patientName: row.patientName,
      patientCity: row.patientCity,
      hospitalId: row.request.hospitalId,
      hospitalName: row.hospitalName,
      organType: row.request.organType,
      bloodGroup: row.request.bloodGroup,
      status: row.request.status,
      urgencyLevel: row.request.urgencyLevel,
      notes: row.request.notes ?? undefined,
      createdAt: toIso(row.request.createdAt),
      updatedAt: toIso(row.request.updatedAt),
    };
  }

  private async getRequestById(requestId: string): Promise<TransplantRequest | undefined> {
    const rows = await db
      .select({
        request: transplantRequests,
        patientName: users.name,
        patientCity: users.city,
        hospitalName: hospitals.name,
      })
      .from(transplantRequests)
      .innerJoin(users, eq(users.id, transplantRequests.patientId))
      .innerJoin(hospitals, eq(hospitals.id, transplantRequests.hospitalId))
      .where(eq(transplantRequests.id, requestId))
      .limit(1);

    const row = rows[0];
    if (!row) return undefined;
    return this.mapRequestRow(row);
  }

  private async seedIfEmpty() {
    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users);
    if (Number(count) > 0) return;

    await db.transaction(async (tx) => {
      const now = new Date();

      const seededUsers: Array<{ id: string; name: string; email: string; role: "hospital" | "patient"; city: string; phone: string; password: string }> = [
        {
          id: randomUUID(),
          name: "Ruby Hall Hospital",
          email: "hospital.pune@transplant.local",
          role: "hospital",
          city: "Pune",
          phone: "+91-20-26163391",
          password: "Hospital123!",
        },
        {
          id: randomUUID(),
          name: "Kokilaben Hospital",
          email: "hospital.mumbai@transplant.local",
          role: "hospital",
          city: "Mumbai",
          phone: "+91-22-30999999",
          password: "Hospital123!",
        },
        {
          id: randomUUID(),
          name: "Apollo Hospitals",
          email: "hospital.delhi@transplant.local",
          role: "hospital",
          city: "Delhi",
          phone: "+91-11-71791090",
          password: "Hospital123!",
        },
        {
          id: randomUUID(),
          name: "Manipal Hospital",
          email: "hospital.bangalore@transplant.local",
          role: "hospital",
          city: "Bangalore",
          phone: "+91-80-22221111",
          password: "Hospital123!",
        },
        {
          id: randomUUID(),
          name: "Fortis Malar Hospital",
          email: "hospital.chennai@transplant.local",
          role: "hospital",
          city: "Chennai",
          phone: "+91-44-42892222",
          password: "Hospital123!",
        },
        {
          id: randomUUID(),
          name: "Yashoda Hospitals",
          email: "hospital.hyderabad@transplant.local",
          role: "hospital",
          city: "Hyderabad",
          phone: "+91-40-45674567",
          password: "Hospital123!",
        },
        {
          id: randomUUID(),
          name: "AMRI Hospital",
          email: "hospital.kolkata@transplant.local",
          role: "hospital",
          city: "Kolkata",
          phone: "+91-33-66246000",
          password: "Hospital123!",
        },
        {
          id: randomUUID(),
          name: "Aarav Patil",
          email: "patient.pune@transplant.local",
          role: "patient",
          city: "Pune",
          phone: "+91-9876543210",
          password: "Patient123!",
        },
        {
          id: randomUUID(),
          name: "Sara Khan",
          email: "patient.mumbai@transplant.local",
          role: "patient",
          city: "Mumbai",
          phone: "+91-9876543211",
          password: "Patient123!",
        },
        {
          id: randomUUID(),
          name: "Rohan Mehta",
          email: "patient.delhi@transplant.local",
          role: "patient",
          city: "Delhi",
          phone: "+91-9876543212",
          password: "Patient123!",
        },
        {
          id: randomUUID(),
          name: "Diya Iyer",
          email: "patient.bangalore@transplant.local",
          role: "patient",
          city: "Bangalore",
          phone: "+91-9876543213",
          password: "Patient123!",
        },
        {
          id: randomUUID(),
          name: "Arjun Nair",
          email: "patient.chennai@transplant.local",
          role: "patient",
          city: "Chennai",
          phone: "+91-9876543214",
          password: "Patient123!",
        },
        {
          id: randomUUID(),
          name: "Zoya Ali",
          email: "patient.hyderabad@transplant.local",
          role: "patient",
          city: "Hyderabad",
          phone: "+91-9876543215",
          password: "Patient123!",
        },
      ];

      await tx.insert(users).values(
        seededUsers.map((entry) => {
          const credentials = this.hashPassword(entry.password);
          return {
            id: entry.id,
            name: entry.name,
            email: entry.email,
            role: entry.role,
            city: entry.city,
            phone: entry.phone,
            passwordSalt: credentials.salt,
            passwordHash: credentials.hash,
            createdAt: now,
          };
        }),
      );

      const hospitalRows = seededUsers
        .filter((user) => user.role === "hospital")
        .map((user) => ({
          id: randomUUID(),
          userId: user.id,
          name: user.name,
          city: user.city,
          createdAt: now,
        }));

      await tx.insert(hospitals).values(hospitalRows);

      const hospitalByCity = new Map(
        hospitalRows.map((hospital) => [normalize(hospital.city), hospital]),
      );

      const availabilitySeeds: Array<{
        city: string;
        organType: OrganType;
        bloodGroup: BloodGroup;
        quantity: number;
      }> = [
        { city: "Pune", organType: "Kidney", bloodGroup: "O+", quantity: 4 },
        { city: "Pune", organType: "Liver", bloodGroup: "A+", quantity: 2 },
        { city: "Pune", organType: "Cornea", bloodGroup: "B+", quantity: 6 },
        { city: "Pune", organType: "Pancreas", bloodGroup: "AB-", quantity: 1 },
        { city: "Mumbai", organType: "Heart", bloodGroup: "AB+", quantity: 1 },
        { city: "Mumbai", organType: "Kidney", bloodGroup: "O+", quantity: 3 },
        { city: "Mumbai", organType: "Lungs", bloodGroup: "A-", quantity: 2 },
        { city: "Mumbai", organType: "Liver", bloodGroup: "B+", quantity: 2 },
        { city: "Delhi", organType: "Kidney", bloodGroup: "A+", quantity: 5 },
        { city: "Delhi", organType: "Liver", bloodGroup: "O-", quantity: 2 },
        { city: "Delhi", organType: "Heart", bloodGroup: "B-", quantity: 1 },
        { city: "Delhi", organType: "Cornea", bloodGroup: "AB+", quantity: 4 },
        { city: "Bangalore", organType: "Lungs", bloodGroup: "O+", quantity: 3 },
        { city: "Bangalore", organType: "Kidney", bloodGroup: "A-", quantity: 3 },
        { city: "Bangalore", organType: "Pancreas", bloodGroup: "B+", quantity: 1 },
        { city: "Bangalore", organType: "Cornea", bloodGroup: "O-", quantity: 5 },
        { city: "Chennai", organType: "Liver", bloodGroup: "AB-", quantity: 2 },
        { city: "Chennai", organType: "Kidney", bloodGroup: "B+", quantity: 4 },
        { city: "Chennai", organType: "Heart", bloodGroup: "A+", quantity: 1 },
        { city: "Chennai", organType: "Cornea", bloodGroup: "O+", quantity: 6 },
        { city: "Hyderabad", organType: "Lungs", bloodGroup: "AB+", quantity: 2 },
        { city: "Hyderabad", organType: "Pancreas", bloodGroup: "A-", quantity: 1 },
        { city: "Hyderabad", organType: "Kidney", bloodGroup: "B-", quantity: 3 },
        { city: "Hyderabad", organType: "Liver", bloodGroup: "O+", quantity: 2 },
        { city: "Kolkata", organType: "Kidney", bloodGroup: "AB+", quantity: 2 },
        { city: "Kolkata", organType: "Liver", bloodGroup: "A+", quantity: 2 },
        { city: "Kolkata", organType: "Cornea", bloodGroup: "B-", quantity: 7 },
        { city: "Kolkata", organType: "Lungs", bloodGroup: "O-", quantity: 1 },
      ];

      const seededAvailability: Array<typeof organAvailability.$inferInsert> = [];
      for (const seed of availabilitySeeds) {
        const hospital = hospitalByCity.get(normalize(seed.city));
        if (!hospital) continue;

        seededAvailability.push({
          id: randomUUID(),
          hospitalId: hospital.id,
          organType: seed.organType,
          bloodGroup: seed.bloodGroup,
          quantity: seed.quantity,
          status: seed.quantity > 0 ? "AVAILABLE" : "UNAVAILABLE",
          city: seed.city,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (seededAvailability.length > 0) {
        await tx.insert(organAvailability).values(seededAvailability);
      }
    });
  }

  async createUser(input: AuthSignupInput): Promise<AuthUser> {
    await this.ensureInitialized();
    const email = normalize(input.email);

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      throw new Error("Email already exists");
    }

    const now = new Date();
    const { salt, hash } = this.hashPassword(input.password);

    const createdUser = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          id: randomUUID(),
          name: input.name,
          email,
          role: input.role,
          city: input.city,
          phone: input.phone,
          passwordSalt: salt,
          passwordHash: hash,
          createdAt: now,
        })
        .returning();

      if (input.role === "hospital") {
        await tx.insert(hospitals).values({
          id: randomUUID(),
          userId: created.id,
          name: created.name,
          city: created.city,
          createdAt: now,
        });
      }

      return created;
    });

    return toAuthUser(createdUser);
  }

  async authenticateUser(input: AuthLoginInput): Promise<AuthUser | null> {
    await this.ensureInitialized();
    const email = normalize(input.email);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return null;

    const { hash } = this.hashPassword(input.password, user.passwordSalt);
    if (hash !== user.passwordHash) return null;

    return toAuthUser(user);
  }

  async getUserById(id: string): Promise<AuthUser | undefined> {
    await this.ensureInitialized();
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user ? toAuthUser(user) : undefined;
  }

  async getHospitalForUser(userId: string): Promise<Hospital | undefined> {
    await this.ensureInitialized();
    const [hospital] = await db
      .select()
      .from(hospitals)
      .where(eq(hospitals.userId, userId))
      .limit(1);

    return hospital ? toHospital(hospital) : undefined;
  }

  async getHospitalAvailability(userId: string): Promise<OrganAvailability[]> {
    await this.ensureInitialized();
    const hospital = await this.getHospitalOrThrow(userId);

    const rows = await db
      .select()
      .from(organAvailability)
      .where(eq(organAvailability.hospitalId, hospital.id))
      .orderBy(desc(organAvailability.updatedAt));

    return rows.map(toAvailability);
  }

  async addHospitalAvailability(userId: string, input: CreateOrganAvailability): Promise<OrganAvailability> {
    await this.ensureInitialized();
    const hospital = await this.getHospitalOrThrow(userId);

    const existingRows = await db
      .select()
      .from(organAvailability)
      .where(
        and(
          eq(organAvailability.hospitalId, hospital.id),
          eq(organAvailability.organType, input.organType),
          eq(organAvailability.bloodGroup, input.bloodGroup),
        ),
      )
      .orderBy(desc(organAvailability.updatedAt));

    const existing = existingRows.find((entry) => normalize(entry.city) === normalize(input.city));
    const now = new Date();

    if (existing) {
      const [updated] = await db
        .update(organAvailability)
        .set({
          quantity: existing.quantity + input.quantity,
          status: existing.quantity + input.quantity > 0 ? "AVAILABLE" : "UNAVAILABLE",
          updatedAt: now,
        })
        .where(eq(organAvailability.id, existing.id))
        .returning();

      return toAvailability(updated);
    }

    const [created] = await db
      .insert(organAvailability)
      .values({
        id: randomUUID(),
        hospitalId: hospital.id,
        organType: input.organType,
        bloodGroup: input.bloodGroup,
        quantity: input.quantity,
        status: input.quantity > 0 ? "AVAILABLE" : "UNAVAILABLE",
        city: input.city,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toAvailability(created);
  }

  async deleteHospitalAvailability(userId: string, availabilityId: string): Promise<void> {
    await this.ensureInitialized();
    const hospital = await this.getHospitalOrThrow(userId);

    const deleted = await db
      .delete(organAvailability)
      .where(and(eq(organAvailability.id, availabilityId), eq(organAvailability.hospitalId, hospital.id)))
      .returning({ id: organAvailability.id });

    if (deleted.length === 0) {
      throw new Error("Availability entry not found");
    }
  }

  async reduceHospitalAvailability(userId: string, availabilityId: string, amount: number): Promise<OrganAvailability> {
    await this.ensureInitialized();
    const hospital = await this.getHospitalOrThrow(userId);

    return db.transaction(async (tx) => {
      const [entry] = await tx
        .select()
        .from(organAvailability)
        .where(and(eq(organAvailability.id, availabilityId), eq(organAvailability.hospitalId, hospital.id)))
        .limit(1);

      if (!entry) throw new Error("Availability entry not found");
      if (amount > entry.quantity) throw new Error("Cannot reduce by more than current quantity");

      const newQuantity = entry.quantity - amount;
      const [updated] = await tx
        .update(organAvailability)
        .set({
          quantity: newQuantity,
          status: newQuantity > 0 ? "AVAILABLE" : "UNAVAILABLE",
          updatedAt: new Date(),
        })
        .where(eq(organAvailability.id, entry.id))
        .returning();

      return toAvailability(updated);
    });
  }

  async searchAvailabilityForPatient(input: PatientSearchInput): Promise<HospitalAvailabilityView[]> {
    await this.ensureInitialized();
    const cityKey = normalize(input.city);
    const compatibleGroups: BloodGroup[] = input.useCompatibility
      ? ((BLOOD_COMPATIBILITY[input.bloodGroup] ?? [input.bloodGroup]) as BloodGroup[])
      : [input.bloodGroup];

    const rows = await db
      .select({
        availabilityId: organAvailability.id,
        hospitalId: organAvailability.hospitalId,
        hospitalName: hospitals.name,
        city: organAvailability.city,
        organType: organAvailability.organType,
        bloodGroup: organAvailability.bloodGroup,
        quantity: organAvailability.quantity,
        status: organAvailability.status,
        createdAt: organAvailability.createdAt,
      })
      .from(organAvailability)
      .innerJoin(hospitals, eq(hospitals.id, organAvailability.hospitalId))
      .where(
        and(
          sql`lower(${organAvailability.city}) = ${cityKey}`,
          eq(organAvailability.organType, input.organType),
          inArray(organAvailability.bloodGroup, compatibleGroups),
          eq(organAvailability.status, "AVAILABLE"),
          sql`${organAvailability.quantity} > 0`,
        ),
      );

    const now = Date.now();

    return rows
      .map((entry) => {
        const waitDays = Math.floor((now - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        const urgencyScore = input.urgencyLevel ? URGENCY_SCORE[input.urgencyLevel] ?? 0 : 0;
        const priorityScore = urgencyScore + Math.min(waitDays * 2, 50) + entry.quantity * 5;

        return {
          availabilityId: entry.availabilityId,
          hospitalId: entry.hospitalId,
          hospitalName: entry.hospitalName,
          city: entry.city,
          organType: entry.organType,
          bloodGroup: entry.bloodGroup,
          quantity: entry.quantity,
          status: entry.status,
          priorityScore,
          isCompatible: entry.bloodGroup === input.bloodGroup,
        } satisfies HospitalAvailabilityView;
      })
      .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
  }

  async createRequest(
    patientUserId: string,
    hospitalId: string,
    organType: OrganType,
    bloodGroup: BloodGroup,
    urgencyLevel: UrgencyLevel = "MEDIUM",
    notes?: string,
  ): Promise<TransplantRequest> {
    await this.ensureInitialized();

    const result = await db.transaction(async (tx) => {
      const [patient] = await tx
        .select()
        .from(users)
        .where(and(eq(users.id, patientUserId), eq(users.role, "patient")))
        .limit(1);

      if (!patient) throw new Error("Patient account not found");

      const [hospital] = await tx
        .select()
        .from(hospitals)
        .where(eq(hospitals.id, hospitalId))
        .limit(1);

      if (!hospital) throw new Error("Hospital not found");

      const [stock] = await tx
        .select({ id: organAvailability.id })
        .from(organAvailability)
        .where(
          and(
            eq(organAvailability.hospitalId, hospital.id),
            eq(organAvailability.organType, organType),
            eq(organAvailability.bloodGroup, bloodGroup),
            eq(organAvailability.status, "AVAILABLE"),
            sql`${organAvailability.quantity} > 0`,
          ),
        )
        .limit(1);

      if (!stock) {
        throw new Error("Selected organ and blood group are currently unavailable at this hospital");
      }

      const now = new Date();
      const [request] = await tx
        .insert(transplantRequests)
        .values({
          id: randomUUID(),
          patientId: patient.id,
          hospitalId: hospital.id,
          organType,
          bloodGroup,
          status: "PENDING",
          urgencyLevel,
          notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return {
        request,
        patientName: patient.name,
        patientCity: patient.city,
        hospitalName: hospital.name,
      };
    });

    return this.mapRequestRow(result);
  }

  async getPatientRequests(patientUserId: string): Promise<TransplantRequest[]> {
    await this.ensureInitialized();

    const rows = await db
      .select({
        request: transplantRequests,
        patientName: users.name,
        patientCity: users.city,
        hospitalName: hospitals.name,
      })
      .from(transplantRequests)
      .innerJoin(users, eq(users.id, transplantRequests.patientId))
      .innerJoin(hospitals, eq(hospitals.id, transplantRequests.hospitalId))
      .where(eq(transplantRequests.patientId, patientUserId))
      .orderBy(desc(transplantRequests.createdAt));

    return rows.map((row) => this.mapRequestRow(row));
  }

  async getHospitalRequests(hospitalUserId: string): Promise<TransplantRequest[]> {
    await this.ensureInitialized();
    const hospital = await this.getHospitalOrThrow(hospitalUserId);

    const rows = await db
      .select({
        request: transplantRequests,
        patientName: users.name,
        patientCity: users.city,
        hospitalName: hospitals.name,
      })
      .from(transplantRequests)
      .innerJoin(users, eq(users.id, transplantRequests.patientId))
      .innerJoin(hospitals, eq(hospitals.id, transplantRequests.hospitalId))
      .where(eq(transplantRequests.hospitalId, hospital.id))
      .orderBy(desc(transplantRequests.createdAt));

    return rows
      .map((row) => this.mapRequestRow(row))
      .sort((a, b) => {
        const urgDiff = (URGENCY_SCORE[b.urgencyLevel] ?? 0) - (URGENCY_SCORE[a.urgencyLevel] ?? 0);
        if (urgDiff !== 0) return urgDiff;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }

  async updateRequestStatus(hospitalUserId: string, requestId: string, status: "ACCEPTED" | "REJECTED"): Promise<TransplantRequest> {
    await this.ensureInitialized();

    await db.transaction(async (tx) => {
      const [hospital] = await tx
        .select()
        .from(hospitals)
        .where(eq(hospitals.userId, hospitalUserId))
        .limit(1);

      if (!hospital) throw new Error("Hospital account not found");

      const [request] = await tx
        .select()
        .from(transplantRequests)
        .where(eq(transplantRequests.id, requestId))
        .limit(1);

      if (!request) throw new Error("Request not found");
      if (request.hospitalId !== hospital.id) throw new Error("This request does not belong to your hospital");
      if (request.status !== "PENDING") throw new Error("Only pending requests can be updated");

      const now = new Date();

      await tx
        .update(transplantRequests)
        .set({ status, updatedAt: now })
        .where(eq(transplantRequests.id, request.id));

      if (status !== "ACCEPTED") return;

      const [stock] = await tx
        .select()
        .from(organAvailability)
        .where(
          and(
            eq(organAvailability.hospitalId, hospital.id),
            eq(organAvailability.organType, request.organType),
            eq(organAvailability.bloodGroup, request.bloodGroup),
            sql`${organAvailability.quantity} > 0`,
          ),
        )
        .orderBy(desc(organAvailability.updatedAt))
        .limit(1);

      if (!stock) throw new Error("No inventory left for this organ");

      const newQuantity = stock.quantity - 1;
      await tx
        .update(organAvailability)
        .set({
          quantity: newQuantity,
          status: newQuantity > 0 ? "AVAILABLE" : "UNAVAILABLE",
          updatedAt: now,
        })
        .where(eq(organAvailability.id, stock.id));

      await tx
        .update(transplantRequests)
        .set({ status: "REJECTED", updatedAt: now })
        .where(
          and(
            ne(transplantRequests.id, request.id),
            eq(transplantRequests.hospitalId, request.hospitalId),
            eq(transplantRequests.organType, request.organType),
            eq(transplantRequests.bloodGroup, request.bloodGroup),
            eq(transplantRequests.status, "PENDING"),
          ),
        );
    });

    const updated = await this.getRequestById(requestId);
    if (!updated) throw new Error("Request not found");
    return updated;
  }

  async getStats(): Promise<Stats> {
    await this.ensureInitialized();

    const availableRows = await db
      .select({
        organType: organAvailability.organType,
        bloodGroup: organAvailability.bloodGroup,
        quantity: organAvailability.quantity,
      })
      .from(organAvailability)
      .where(eq(organAvailability.status, "AVAILABLE"));

    const totalAvailableOrgans = availableRows.reduce((sum, row) => sum + row.quantity, 0);

    const organBreakdown: Record<string, number> = {};
    for (const row of availableRows) {
      organBreakdown[row.organType] = (organBreakdown[row.organType] ?? 0) + row.quantity;
    }

    const bloodGroupBreakdown: Record<string, number> = {};
    for (const row of availableRows) {
      bloodGroupBreakdown[row.bloodGroup] = (bloodGroupBreakdown[row.bloodGroup] ?? 0) + row.quantity;
    }

    const [{ totalHospitals }] = await db
      .select({ totalHospitals: sql<number>`count(*)` })
      .from(hospitals);

    const [{ totalRequests }] = await db
      .select({ totalRequests: sql<number>`count(*)` })
      .from(transplantRequests);

    const [{ pendingRequests }] = await db
      .select({ pendingRequests: sql<number>`count(*)` })
      .from(transplantRequests)
      .where(eq(transplantRequests.status, "PENDING"));

    const [{ acceptedRequests }] = await db
      .select({ acceptedRequests: sql<number>`count(*)` })
      .from(transplantRequests)
      .where(eq(transplantRequests.status, "ACCEPTED"));

    const [{ rejectedRequests }] = await db
      .select({ rejectedRequests: sql<number>`count(*)` })
      .from(transplantRequests)
      .where(eq(transplantRequests.status, "REJECTED"));

    return {
      totalAvailableOrgans,
      totalHospitals: Number(totalHospitals),
      totalRequests: Number(totalRequests),
      pendingRequests: Number(pendingRequests),
      acceptedRequests: Number(acceptedRequests),
      rejectedRequests: Number(rejectedRequests),
      organBreakdown,
      bloodGroupBreakdown,
    };
  }
}

export const storage = new PostgresStorage();
