import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "GreenLoop Yield API is running" });
  });

  // Mock API endpoints for future expansion
  app.get("/api/lots", (req, res) => {
    res.json({ message: "Carbon lots endpoint - to be implemented" });
  });

  app.get("/api/orders", (req, res) => {
    res.json({ message: "Orders endpoint - to be implemented" });
  });

  app.get("/api/proof-feed", (req, res) => {
    res.json({ message: "Proof feed endpoint - to be implemented" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
