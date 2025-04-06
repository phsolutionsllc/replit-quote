import { Request, Response } from "express";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { carriers, carrierPreferences, insertCarrierPreferenceSchema } from "@shared/schema";

// Get carrier preferences for a location/user
export const getCarrierPreferences = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    
    if (!locationId) {
      return res.status(400).json({ error: "Location ID is required" });
    }

    // Get all carriers
    const allCarriers = await db.select().from(carriers);
    
    // Get preferences for this locationId
    const preferences = await db.select()
      .from(carrierPreferences)
      .where(eq(carrierPreferences.userId, parseInt(locationId)));
    
    // Create preferences object
    const termPreferences: Record<string, boolean> = {};
    const fexPreferences: Record<string, boolean> = {};
    
    // Initialize with all carriers set to true (default)
    allCarriers.forEach(carrier => {
      if (carrier.type === "term" || carrier.type === "both") {
        termPreferences[carrier.name] = true;
      }
      if (carrier.type === "fex" || carrier.type === "both") {
        fexPreferences[carrier.name] = true;
      }
    });
    
    // Apply stored preferences
    preferences.forEach(pref => {
      const carrier = allCarriers.find(c => c.id === pref.carrierId);
      if (carrier) {
        if (carrier.type === "term" || carrier.type === "both") {
          termPreferences[carrier.name] = pref.isPreferred;
        }
        if (carrier.type === "fex" || carrier.type === "both") {
          fexPreferences[carrier.name] = pref.isPreferred;
        }
      }
    });
    
    res.json({
      termPreferences,
      fexPreferences
    });
  } catch (error) {
    console.error("Error getting carrier preferences:", error);
    res.status(500).json({ error: "Failed to get carrier preferences" });
  }
};

// Save carrier preferences for a location/user
export const saveCarrierPreferences = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    const { termPreferences, fexPreferences } = req.body;
    
    if (!locationId) {
      return res.status(400).json({ error: "Location ID is required" });
    }
    
    if (!termPreferences && !fexPreferences) {
      return res.status(400).json({ error: "Preferences data is required" });
    }
    
    const userId = parseInt(locationId);
    
    // Get all carriers
    const allCarriers = await db.select().from(carriers);
    
    // Delete existing preferences for this user
    await db.delete(carrierPreferences)
      .where(eq(carrierPreferences.userId, userId));
    
    // Insert new preferences
    const preferences = [];
    
    for (const carrier of allCarriers) {
      if ((carrier.type === "term" || carrier.type === "both") && termPreferences) {
        const isPreferred = termPreferences[carrier.name] === true;
        preferences.push({
          userId,
          carrierId: carrier.id,
          isPreferred
        });
      }
      
      if ((carrier.type === "fex" || carrier.type === "both") && fexPreferences) {
        const isPreferred = fexPreferences[carrier.name] === true;
        
        // Only add if we didn't add it already from termPreferences
        if (carrier.type !== "both" || !termPreferences) {
          preferences.push({
            userId,
            carrierId: carrier.id,
            isPreferred
          });
        }
      }
    }
    
    if (preferences.length > 0) {
      await db.insert(carrierPreferences).values(preferences);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving carrier preferences:", error);
    res.status(500).json({ error: "Failed to save carrier preferences" });
  }
};