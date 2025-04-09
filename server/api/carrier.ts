import type { Request, Response } from "express";
import fs from "fs";
import path from "path";

// Load carrier data from JSON files
const termFile = path.join(import.meta.dirname, "../../attached_assets/termsheet.json");
const fexFile = path.join(import.meta.dirname, "../../attached_assets/fexsheet.json");

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

// Define the full list of carriers exactly as in the original application
const TERM_CARRIERS = {
  'American Amicable': [
    'American Amicable (Easy Term)',
    'American Amicable (Home Certainty)',
    'American Amicable (Home Protector)',
    'American Amicable (Pioneer Security)',
    'American Amicable (Safecare Term)',
    'American Amicable (Survivor Protector)',
    'American Amicable (Term Made Simple)'
  ],
  'Americo': [
    'Americo (Continuation 10)',
    'Americo (Continuation 25)',
    'Americo (HMS)',
    'Americo (Payment Protector Continuation)',
    'Americo (Payment Protector)'
  ],
  'Foresters': [
    'Foresters (Strong Foundation)',
    'Foresters (Your Term Medical)',
    'Foresters (Your Term)'
  ],
  'Other': [
    'GTL (Turbo Term)',
    'InstaBrain (Term)',
    'John Hancock (Simple Term with Vitality 2023)',
    'Kansas City Life',
    'Mutual of Omaha (Term Life Express)',
    'National Life Group (LSW Level Term)',
    'Primerica (Term Now)',
    'Protective (Classic Choice Term)',
    'UHL (Simple Term)'
  ],
  'Quoting Only': [
    'Royal Neighbors (Jet Term)',
    'Transamerica (Trendsetter LB 2017)',
    'Transamerica (Trendsetter Super 2021)',
  ]
};

const FEX_CARRIERS = {
  'AIG': ['AIG (GIWL)', 'AIG (SIWL)'],
  'Aetna': [
    'Aetna (Protection Series)',
    'Aetna (Protection Series) (MT)'
  ],
  'American Amicable': [
    'American Amicable (American Guardian)',
    'American Amicable (American Legacy)',
    'American Amicable (Dignity Solutions)',
    'American Amicable (Family Choice)',
    'American Amicable (Family Legacy)',
    'American Amicable (Family Protector Family Plan)',
    'American Amicable (Family Protector Legacy Plan)',
    'American Amicable (Family Solution)',
    'American Amicable (Golden Solution)',
    'American Amicable (Innovative Choice)',
    'American Amicable (Innovative Solutions)',
    'American Amicable (Peace of Mind Family Plan)',
    'American Amicable (Peace of Mind NC)',
    'American Amicable (Peace of Mind)',
    'American Amicable (Platinum Solution Family Plan)',
    'American Amicable (Platinum Solution Legacy Plan)',
    'American Amicable (Senior Choice)'
  ],
  'American Home Life': [
    'American Home Life (GuideStar 0-44)',
    'American Home Life (GuideStar 45+)',
    'American Home Life (Patriot Series)'
  ],
  'Baltimore Life': [
    'Baltimore Life (Silver Guard)',
    'Baltimore Life (aPriority 0-49)',
    'Baltimore Life (aPriority 50+)',
    'Baltimore Life (iProvide 45-69)',
    'Baltimore Life (iProvide 70+)'
  ],
  'Bankers Fidelity': [
    'Bankers Fidelity Final Expense',
    'Bankers Fidelity Final Expense (MT)'
  ],
  'CVS': [
    'CVS (Aetna Accendo)',
    'CVS (Aetna Accendo) (MT)'
  ],
  'Occidental Life': [
    'Occidental Life (American Guardian)',
    'Occidental Life (American Legacy)',
    'Occidental Life (Dignity Solutions)',
    'Occidental Life (Family Choice)',
    'Occidental Life (Family Legacy)',
    'Occidental Life (Family Protector Family Plan)',
    'Occidental Life (Family Protector Legacy Plan)',
    'Occidental Life (Family Solution)',
    'Occidental Life (Golden Solution)',
    'Occidental Life (Innovative Choice)',
    'Occidental Life (Innovative Solutions)',
    'Occidental Life (Peace of Mind Family Plan)',
    'Occidental Life (Peace of Mind NC)',
    'Occidental Life (Peace of Mind)',
    'Occidental Life (Platinum Solution Family Plan)',
    'Occidental Life (Platinum Solution Legacy Plan)',
    'Occidental Life (Senior Choice)'
  ],
  'Royal Arcanum': [
    'Royal Arcanum (Graded Benefit)',
    'Royal Arcanum (SIWL)',
    'Royal Arcanum (Whole Life)'
  ],
  'Royal Neighbors': [
    'Royal Neighbors (Ensured Legacy)',
    'Royal Neighbors (Jet Whole Life)'
  ],
  'Transamerica': [
    'Transamerica (Express)',
    'Transamerica (Solutions)'
  ],
  'Other': [
    'Aflac (Final Expense)',
    'Americo',
    'Better Life',
    'Catholic Financial (Graded Whole Life)',
    'Christian Fidelity',
    'Cica Life (Superior Choice)',
    'Cincinnati Equitable',
    'Elco (Silver Eagle)',
    'Family Benefit Life',
    'Fidelity Life (RAPIDecision Guaranteed Issue)',
    'First Guaranty',
    'Foresters (PlanRight)',
    'GPM',
    'Gerber',
    'Guarantee Trust Life',
    'Illinois Mutual (Path Protector Plus)',
    'KSKJ',
    'LCBA (Loyal Christian Benefit Association)',
    'Lafayette Life',
    'Liberty Bankers',
    'Lifeshield',
    'Lincoln Heritage',
    'Mutual of Omaha (Living Promise)',
    'Oxford',
    'Pekin (Final Expense)',
    'Polish Falcons',
    'SBLI (Living Legacy)',
    'Security National (Loyalty Plan)',
    'Senior Life (Platinum Protection)',
    'Sentinel',
    'Standard Life',
    'Trinity Life',
    'UHL'
  ],
  'Quoting Only': [
    'Mountain Life',
  ]
};

// Get all carriers
export const getCarriers = (req: Request, res: Response) => {
  try {
    // Get carriers available in the JSON files from actual underwriting status
    const jsonTermCarriers = new Set<string>();
    const jsonFexCarriers = new Set<string>();
    
    // Extract Term carriers from JSON
    if (termData && termData.Term && termData.Term.Conditions) {
      Object.values(termData.Term.Conditions).forEach((condition: any) => {
        if (condition.finalResults) {
          condition.finalResults.forEach((finalResult: any) => {
            if (finalResult.underwriting) {
              finalResult.underwriting.forEach((uw: any) => {
                if (uw.company) {
                  jsonTermCarriers.add(uw.company);
                }
              });
            }
          });
        }
      });
    }
    
    // Extract FEX carriers from JSON
    if (fexData && fexData.FEX && fexData.FEX.Conditions) {
      Object.values(fexData.FEX.Conditions).forEach((condition: any) => {
        if (condition.finalResults) {
          condition.finalResults.forEach((finalResult: any) => {
            if (finalResult.underwriting) {
              finalResult.underwriting.forEach((uw: any) => {
                if (uw.company) {
                  jsonFexCarriers.add(uw.company);
                }
              });
            }
          });
        }
      });
    }

    // Combine all carriers from both JSON and predefined lists
    // and create the carriers list with proper type information
    const carriers: Array<{id: string; name: string; type: "term" | "fex" | "both"}> = [];
    const processedCarriers = new Set<string>();
    
    // Process TERM carriers
    Object.entries(TERM_CARRIERS).forEach(([group, carrierList]) => {
      carrierList.forEach(carrier => {
        // Check if this carrier exists in the JSON files
        const isInJson = jsonTermCarriers.has(carrier);
        
        if (!processedCarriers.has(carrier)) {
          processedCarriers.add(carrier);
          carriers.push({
            id: carrier.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""),
            name: carrier,
            type: "term"
          });
        }
      });
    });
    
    // Process FEX carriers
    Object.entries(FEX_CARRIERS).forEach(([group, carrierList]) => {
      carrierList.forEach(carrier => {
        // If carrier already added as TERM, update its type to BOTH
        const existingIndex = carriers.findIndex(c => 
          c.name.toLowerCase() === carrier.toLowerCase());
        
        if (existingIndex >= 0) {
          carriers[existingIndex].type = "both";
        } else if (!processedCarriers.has(carrier)) {
          processedCarriers.add(carrier);
          carriers.push({
            id: carrier.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""),
            name: carrier,
            type: "fex"
          });
        }
      });
    });
    
    // Add any carriers from JSON that weren't in predefined lists
    Array.from(jsonTermCarriers).forEach(carrier => {
      if (!processedCarriers.has(carrier)) {
        processedCarriers.add(carrier);
        
        // Check if it's also in FEX
        const type = jsonFexCarriers.has(carrier) ? "both" : "term";
        
        carriers.push({
          id: carrier.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""),
          name: carrier,
          type
        });
      }
    });
    
    Array.from(jsonFexCarriers).forEach(carrier => {
      if (!processedCarriers.has(carrier)) {
        carriers.push({
          id: carrier.toLowerCase().replace(/\s+/g, "-").replace(/[()]/g, ""),
          name: carrier,
          type: "fex"
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
