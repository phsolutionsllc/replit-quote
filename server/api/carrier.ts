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

// Get all carriers
export const getCarriers = (req: Request, res: Response) => {
  try {
    const termCarriers = new Set<string>();
    const fexCarriers = new Set<string>();
    
    // Extract Term carriers
    Object.values(termData.Term.Conditions).forEach((condition: any) => {
      condition.finalResults.forEach((finalResult: any) => {
        finalResult.underwriting.forEach((uw: any) => {
          termCarriers.add(uw.company);
        });
      });
    });
    
    // Extract FEX carriers
    Object.values(fexData.FEX.Conditions).forEach((condition: any) => {
      condition.finalResults.forEach((finalResult: any) => {
        finalResult.underwriting.forEach((uw: any) => {
          fexCarriers.add(uw.company);
        });
      });
    });
    
    // Combine carriers into a single list with type information
    const carriers: Array<{id: string; name: string; type: "term" | "fex" | "both"}> = [];
    
    // Add Term-only carriers
    Array.from(termCarriers).forEach(carrierName => {
      if (!fexCarriers.has(carrierName)) {
        carriers.push({
          id: carrierName.toLowerCase().replace(/\s+/g, "-"),
          name: carrierName,
          type: "term",
        });
      }
    });
    
    // Add FEX-only carriers
    Array.from(fexCarriers).forEach(carrierName => {
      if (!termCarriers.has(carrierName)) {
        carriers.push({
          id: carrierName.toLowerCase().replace(/\s+/g, "-"),
          name: carrierName,
          type: "fex",
        });
      }
    });
    
    // Add carriers that offer both Term and FEX
    Array.from(termCarriers).forEach(carrierName => {
      if (fexCarriers.has(carrierName)) {
        carriers.push({
          id: carrierName.toLowerCase().replace(/\s+/g, "-"),
          name: carrierName,
          type: "both",
        });
      }
    });
    
    res.json(carriers);
  } catch (error) {
    console.error("Error getting carriers:", error);
    res.status(500).json({ error: "Failed to get carriers" });
  }
};

// Get all states
export const getStates = (req: Request, res: Response) => {
  const states = [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    { code: "HI", name: "Hawaii" },
    { code: "ID", name: "Idaho" },
    { code: "IL", name: "Illinois" },
    { code: "IN", name: "Indiana" },
    { code: "IA", name: "Iowa" },
    { code: "KS", name: "Kansas" },
    { code: "KY", name: "Kentucky" },
    { code: "LA", name: "Louisiana" },
    { code: "ME", name: "Maine" },
    { code: "MD", name: "Maryland" },
    { code: "MA", name: "Massachusetts" },
    { code: "MI", name: "Michigan" },
    { code: "MN", name: "Minnesota" },
    { code: "MS", name: "Mississippi" },
    { code: "MO", name: "Missouri" },
    { code: "MT", name: "Montana" },
    { code: "NE", name: "Nebraska" },
    { code: "NV", name: "Nevada" },
    { code: "NH", name: "New Hampshire" },
    { code: "NJ", name: "New Jersey" },
    { code: "NM", name: "New Mexico" },
    { code: "NY", name: "New York" },
    { code: "NC", name: "North Carolina" },
    { code: "ND", name: "North Dakota" },
    { code: "OH", name: "Ohio" },
    { code: "OK", name: "Oklahoma" },
    { code: "OR", name: "Oregon" },
    { code: "PA", name: "Pennsylvania" },
    { code: "RI", name: "Rhode Island" },
    { code: "SC", name: "South Carolina" },
    { code: "SD", name: "South Dakota" },
    { code: "TN", name: "Tennessee" },
    { code: "TX", name: "Texas" },
    { code: "UT", name: "Utah" },
    { code: "VT", name: "Vermont" },
    { code: "VA", name: "Virginia" },
    { code: "WA", name: "Washington" },
    { code: "WV", name: "West Virginia" },
    { code: "WI", name: "Wisconsin" },
    { code: "WY", name: "Wyoming" },
    { code: "DC", name: "District of Columbia" },
  ];
  
  res.json(states);
};
