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

// Use the same carrier structure as in carrier.ts
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

// Default carrier preferences (all enabled)
const defaultPreferences: {
  termPreferences: Record<string, boolean>;
  fexPreferences: Record<string, boolean>;
} = {
  termPreferences: {},
  fexPreferences: {}
};

// Initialize default preferences
function initializeDefaultPreferences() {
  // Process TERM carriers
  Object.entries(TERM_CARRIERS).forEach(([group, carriers]) => {
    carriers.forEach(carrier => {
      defaultPreferences.termPreferences[carrier] = true;
    });
  });
  
  // Process FEX carriers
  Object.entries(FEX_CARRIERS).forEach(([group, carriers]) => {
    carriers.forEach(carrier => {
      defaultPreferences.fexPreferences[carrier] = true;
    });
  });
  
  // Also add carriers from the JSON files
  if (termData && termData.Term && termData.Term.Conditions) {
    Object.values(termData.Term.Conditions).forEach((condition: any) => {
      if (condition.finalResults) {
        condition.finalResults.forEach((finalResult: any) => {
          if (finalResult.underwriting) {
            finalResult.underwriting.forEach((uw: any) => {
              if (uw.company) {
                defaultPreferences.termPreferences[uw.company] = true;
              }
            });
          }
        });
      }
    });
  }
  
  if (fexData && fexData.FEX && fexData.FEX.Conditions) {
    Object.values(fexData.FEX.Conditions).forEach((condition: any) => {
      if (condition.finalResults) {
        condition.finalResults.forEach((finalResult: any) => {
          if (finalResult.underwriting) {
            finalResult.underwriting.forEach((uw: any) => {
              if (uw.company) {
                defaultPreferences.fexPreferences[uw.company] = true;
              }
            });
          }
        });
      }
    });
  }
}

// Initialize default preferences
initializeDefaultPreferences();

// Store carrier preferences by location ID
const carrierPreferencesByLocation: Record<string, {
  termPreferences: Record<string, boolean>;
  fexPreferences: Record<string, boolean>;
}> = {};

// Get carrier preferences for a specific location
export const getCarrierPreferences = async (req: Request, res: Response) => {
  try {
    const { locationId } = req.params;
    
    if (!locationId) {
      return res.status(400).json({ error: "Location ID is required" });
    }
    
    // If preferences don't exist for this location, initialize with defaults
    if (!carrierPreferencesByLocation[locationId]) {
      carrierPreferencesByLocation[locationId] = {
        termPreferences: { ...defaultPreferences.termPreferences },
        fexPreferences: { ...defaultPreferences.fexPreferences }
      };
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
    
    // Validate we have both term and fex preferences
    if (!preferences.termPreferences || !preferences.fexPreferences) {
      return res.status(400).json({ 
        error: "Both termPreferences and fexPreferences are required" 
      });
    }
    
    // Save preferences for this location
    carrierPreferencesByLocation[locationId] = {
      termPreferences: { ...preferences.termPreferences },
      fexPreferences: { ...preferences.fexPreferences }
    };
    
    res.json({ success: true, message: "Carrier preferences saved successfully" });
  } catch (error) {
    console.error("Error saving carrier preferences:", error);
    res.status(500).json({ error: "Failed to save carrier preferences" });
  }
};