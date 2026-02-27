import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.donors.list.path, async (req, res) => {
    const donors = await storage.getDonors();
    res.json(donors);
  });

  app.post(api.donors.create.path, async (req, res) => {
    try {
      const input = api.donors.create.input.parse(req.body);
      const donor = await storage.addDonor(input);
      res.status(201).json(donor);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.match.find.path, async (req, res) => {
    try {
      const input = api.match.find.input.parse(req.body);
      const matches = await storage.findMatches(input);
      res.json(matches);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
