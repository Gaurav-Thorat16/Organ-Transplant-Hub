import type { Express } from "express";
import { type Server } from "http";
import { z } from "zod";
import { api } from "@shared/routes";
import { reduceAvailabilitySchema } from "@shared/schema";
import { sendRequestReceivedEmail, sendRequestStatusEmail, sendRequestStatusSMS } from "./notifications";
import { storage } from "./storage";

function requireUserId(req: Express.Request) {
  const userId = req.session?.userId;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function requireUser(req: Express.Request) {
  const userId = requireUserId(req);
  const user = await storage.getUserById(userId);
  if (!user) throw new Error("Unauthorized");
  return user;
}

function parseErrorMessage(err: unknown, fallback: string) {
  if (err instanceof z.ZodError) return err.errors[0]?.message ?? fallback;
  return err instanceof Error ? err.message : fallback;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.post(api.auth.signup.path, async (req, res) => {
    try {
      const input = api.auth.signup.input.parse(req.body);
      const user = await storage.createUser(input);
      if (req.session) req.session.userId = user.id;
      res.status(201).json(user);
    } catch (err) {
      const message = parseErrorMessage(err, "Unable to create account");
      res.status(message === "Email already exists" ? 400 : 500).json({ message });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.authenticateUser(input);
      if (!user) return res.status(400).json({ message: "Invalid email or password" });
      if (req.session) req.session.userId = user.id;
      res.json(user);
    } catch (err) {
      res.status(400).json({ message: parseErrorMessage(err, "Unable to sign in") });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      res.json(user);
    } catch {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  app.post(api.auth.logout.path, async (req, res) => {
    req.session?.destroy(() => res.json({ message: "Logged out" }));
  });

  app.get(api.hospitals.mine.path, async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "hospital") return res.status(403).json({ message: "Hospital access required" });
      const hospital = await storage.getHospitalForUser(user.id);
      if (!hospital) return res.status(404).json({ message: "Hospital profile not found" });
      res.json(hospital);
    } catch { res.status(401).json({ message: "Not authenticated" }); }
  });

  app.get(api.hospitals.availabilityList.path, async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "hospital") return res.status(403).json({ message: "Hospital access required" });
      const entries = await storage.getHospitalAvailability(user.id);
      res.json(entries);
    } catch (err) {
      res.status(400).json({ message: parseErrorMessage(err, "Unable to load availability") });
    }
  });

  app.post(api.hospitals.createAvailability.path, async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "hospital") return res.status(403).json({ message: "Hospital access required" });
      const input = api.hospitals.createAvailability.input.parse(req.body);
      const created = await storage.addHospitalAvailability(user.id, input);
      res.status(201).json(created);
    } catch (err) {
      res.status(400).json({ message: parseErrorMessage(err, "Unable to add availability") });
    }
  });

  app.delete("/api/hospitals/availability/:availabilityId", async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "hospital") return res.status(403).json({ message: "Hospital access required" });
      const { availabilityId } = req.params;
      await storage.deleteHospitalAvailability(user.id, availabilityId);
      res.json({ message: "Deleted successfully" });
    } catch (err) {
      res.status(400).json({ message: parseErrorMessage(err, "Unable to delete availability") });
    }
  });

  app.post("/api/hospitals/availability/:availabilityId/reduce", async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "hospital") return res.status(403).json({ message: "Hospital access required" });
      const { availabilityId } = req.params;
      const { amount } = reduceAvailabilitySchema.parse(req.body);
      const updated = await storage.reduceHospitalAvailability(user.id, availabilityId, amount);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: parseErrorMessage(err, "Unable to reduce availability") });
    }
  });

  app.post(api.patients.searchAvailability.path, async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "patient") return res.status(403).json({ message: "Patient access required" });
      const input = api.patients.searchAvailability.input.parse(req.body);
      const results = await storage.searchAvailabilityForPatient(input);
      res.json(results);
    } catch (err) {
      res.status(400).json({ message: parseErrorMessage(err, "Unable to search availability") });
    }
  });

  app.post(api.requests.create.path, async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "patient") return res.status(403).json({ message: "Patient access required" });
      const input = api.requests.create.input.parse(req.body);
      const request = await storage.createRequest(user.id, input.hospitalId, input.organType, input.bloodGroup, input.urgencyLevel, input.notes);
      res.status(201).json(request);

      void sendRequestReceivedEmail(user, { name: request.hospitalName }, input.organType).catch((error) => {
        console.error("Failed to send request received email", error);
      });
    } catch (err) {
      res.status(400).json({ message: parseErrorMessage(err, "Unable to create request") });
    }
  });

  app.get(api.requests.mine.path, async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "patient") return res.status(403).json({ message: "Patient access required" });
      const requests = await storage.getPatientRequests(user.id);
      res.json(requests);
    } catch { res.status(401).json({ message: "Not authenticated" }); }
  });

  app.get(api.requests.incoming.path, async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "hospital") return res.status(403).json({ message: "Hospital access required" });
      const requests = await storage.getHospitalRequests(user.id);
      res.json(requests);
    } catch { res.status(401).json({ message: "Not authenticated" }); }
  });

  app.post(api.requests.updateStatus.path, async (req, res) => {
    try {
      const user = await requireUser(req as Express.Request);
      if (user.role !== "hospital") return res.status(403).json({ message: "Hospital access required" });
      const requestId = String(req.params.requestId || "");
      if (!requestId) return res.status(400).json({ message: "Request id is required" });
      const input = api.requests.updateStatus.input.parse(req.body);
      const updated = await storage.updateRequestStatus(user.id, requestId, input.status);
      res.json(updated);

      void (async () => {
        const patient = await storage.getUserById(updated.patientId);
        if (!patient) return;
        if (updated.status !== "ACCEPTED" && updated.status !== "REJECTED") return;

        await sendRequestStatusEmail(patient, updated.status, updated.organType, updated.hospitalName);

        if (patient.phone) {
          await sendRequestStatusSMS(patient.phone, updated.status, updated.organType, updated.hospitalName);
        }
      })().catch((error) => {
        console.error("Failed to send request status notifications", error);
      });
    } catch (err) {
      res.status(400).json({ message: parseErrorMessage(err, "Unable to update request status") });
    }
  });

  app.get(api.stats.overview.path, async (req, res) => {
    try {
      await requireUser(req as Express.Request);
      const stats = await storage.getStats();
      res.json(stats);
    } catch { res.status(401).json({ message: "Not authenticated" }); }
  });

  return httpServer;
}
