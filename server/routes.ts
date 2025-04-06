import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getQuotes } from "./api/quote";
import { getConditions, getConditionById, searchConditions } from "./api/eligibility";
import { getCarriers, getStates } from "./api/carrier";
import { getCarrierPreferences, saveCarrierPreferences } from "./api/carrier-preferences";
import { getTermSheet, getFexSheet } from "./api/json-data";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  // Quote endpoints
  app.post("/api/quotes", getQuotes);
  
  // Condition endpoints
  app.get("/api/conditions", getConditions);
  app.get("/api/conditions/:id", getConditionById);
  app.get("/api/conditions/search", searchConditions);
  
  // Carrier endpoints
  app.get("/api/carriers", getCarriers);
  
  // State endpoints
  app.get("/api/states", getStates);
  
  // Carrier preferences endpoints
  app.get("/api/carrier-preferences/:locationId", getCarrierPreferences);
  app.post("/api/carrier-preferences/:locationId", saveCarrierPreferences);
  
  // JSON data endpoints
  app.get("/static/js/termsheet.json", getTermSheet);
  app.get("/static/js/fexsheet.json", getFexSheet);
  
  const httpServer = createServer(app);
  return httpServer;
}
