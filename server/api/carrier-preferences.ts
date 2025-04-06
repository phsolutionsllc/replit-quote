import type { Request, Response } from "express";
import fs from "fs";
import path from "path";

// Load carrier data from JSON files
const termFile = path.join(import.meta.dirname, "../../attached_assets/fixed_termsheet.json");
const fexFile = path.join(import.meta.dirname, "../../attached_assets/fixed_fexsheet.json");

let termData: any = {};
let fexData: any = {};

try {
  termData = JSON.parse(fs.readFileSync(termFile, "utf8"));
} catch (error) {
  console.error("Error loading term data:", error);
}

try {
  fexData = JSON.parse(fs.readFileSync(fexFile, "utf8"));
} catch (error) {
  console.error("Error loading fex data:", error);
}

// Default carrier preferences (all enabled)
const defaultPreferences: Record<string, boolean> = {};

// Additional carriers that might not be in the JSON but are common in the industry
const additionalCarriers = [
  "American Amicable",
  "Americo",
  "American National",
  "Assurity",
  "AIG",
  "Banner",
  "Columbus Life",
  "Foresters",
  "John Hancock",
  "Legal & General",
  "Lincoln Financial",
  "Mutual of Omaha",
  "North American",
  "Pacific Life",
  "Principal",
  "Protective",
  "Prudential",
  "SBLI",
  "Securian/Minnesota Life",
  "Symetra",
  "Transamerica",
  "United Home Life",
  "William Penn",
  "Zurich",
  // FEX specific carriers
  "Royal Neighbors",
  "Liberty Bankers Life",
  "Prosperity Life",
  "Columbian Financial",
  "Great Western",
  "Oxford Life",
  "Gerber Life"
];

// Initialize default preferences
function initializeDefaultPreferences() {
  // Add carriers from Term JSON
  Object.values(termData.Term.Conditions).forEach((condition: any) => {
    condition.finalResults.forEach((finalResult: any) => {
      finalResult.underwriting.forEach((uw: any) => {
        defaultPreferences[uw.company] = true;
      });
    });
  });
  
  // Add carriers from FEX JSON
  Object.values(fexData.FEX.Conditions).forEach((condition: any) => {
    condition.finalResults.forEach((finalResult: any) => {
      finalResult.underwriting.forEach((uw: any) => {
        defaultPreferences[uw.company] = true;
      });
    });
  });
  
  // Add additional carriers
  additionalCarriers.forEach(carrier => {
    defaultPreferences[carrier] = true;
  });
}

// Initialize default preferences
initializeDefaultPreferences();

// Store carrier preferences by location ID
const carrierPreferencesByLocation: Record<string, Record<string, boolean>> = {};

// Get carrier preferences for a specific location
export const getCarrierPreferences = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    
    if (!locationId) {
      return res.status(400).json({ error: "Location ID is required" });
    }
    
    // If preferences don't exist for this location, initialize with defaults
    if (!carrierPreferencesByLocation[locationId]) {
      carrierPreferencesByLocation[locationId] = { ...defaultPreferences };
    }
    
    res.json(carrierPreferencesByLocation[locationId]);
  } catch (error) {
    console.error("Error getting carrier preferences:", error);
    res.status(500).json({ error: "Failed to get carrier preferences" });
  }
};

// Save carrier preferences for a specific location
export const saveCarrierPreferences = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    const preferences = req.body;
    
    if (!locationId) {
      return res.status(400).json({ error: "Location ID is required" });
    }
    
    if (!preferences || typeof preferences !== "object") {
      return res.status(400).json({ error: "Valid preferences object is required" });
    }
    
    // Save preferences for this location
    carrierPreferencesByLocation[locationId] = preferences;
    
    res.json({ success: true, message: "Carrier preferences saved successfully" });
  } catch (error) {
    console.error("Error saving carrier preferences:", error);
    res.status(500).json({ error: "Failed to save carrier preferences" });
  }
};