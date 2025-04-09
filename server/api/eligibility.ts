import type { Request, Response } from "express";
import fs from "fs";
import path from "path";

// Load condition data - exact same paths as in the original app.py
const termFile = path.join(import.meta.dirname, "../../attached_assets/termsheet.json");
const fexFile = path.join(import.meta.dirname, "../../attached_assets/fexsheet.json");

let termData: any = {};
let fexData: any = {};

try {
  termData = JSON.parse(fs.readFileSync(termFile, "utf8"));
  console.log("Successfully loaded Term data");
} catch (error) {
  console.error("Error loading term data:", error);
}

try {
  fexData = JSON.parse(fs.readFileSync(fexFile, "utf8"));
  console.log("Successfully loaded FEX data");
} catch (error) {
  console.error("Error loading fex data:", error);
}

// Define condition type - matching the original app.py structure
interface Condition {
  id: string;
  name: string;
  type: "term" | "fex" | "both";
  questions: any[];
  finalResults: any[];
}

// Build unique conditions list from Term and FEX data
const buildUniqueConditions = () => {
  const conditions: Condition[] = [];
  
  // Process Term conditions
  if (termData?.Term?.Conditions) {
    Object.entries(termData.Term.Conditions).forEach(([conditionName, conditionData]: [string, any]) => {
      conditions.push({
        id: `term-${conditionName.toLowerCase().replace(/\s+/g, "-")}`,
        name: conditionName,
        type: "term",
        questions: conditionData.questions || [],
        finalResults: conditionData.finalResults || []
      });
    });
  }
  
  // Process FEX conditions
  if (fexData?.FEX?.Conditions) {
    Object.entries(fexData.FEX.Conditions).forEach(([conditionName, conditionData]: [string, any]) => {
      const existingIndex = conditions.findIndex(c => c.name === conditionName);
      
      if (existingIndex >= 0) {
        // Condition exists in both Term and FEX
        conditions[existingIndex].type = "both";
      } else {
        // FEX-only condition
        conditions.push({
          id: `fex-${conditionName.toLowerCase().replace(/\s+/g, "-")}`,
          name: conditionName,
          type: "fex",
          questions: conditionData.questions || [],
          finalResults: conditionData.finalResults || []
        });
      }
    });
  }
  
  return conditions;
};

const uniqueConditions = buildUniqueConditions();
console.log(`Successfully loaded ${uniqueConditions.length} unique conditions`);

// Get all available conditions
export const getConditions = (req: Request, res: Response) => {
  try {
    const quoteType = req.query.quoteType as string || 'term';
    
    let filteredConditions;
    if (quoteType === 'term') {
      filteredConditions = uniqueConditions.filter(c => c.type === 'term' || c.type === 'both');
    } else {
      filteredConditions = uniqueConditions.filter(c => c.type === 'fex' || c.type === 'both');
    }
    
    console.log(`Returning ${filteredConditions.length} conditions for ${quoteType}`);
    res.json(filteredConditions);
  } catch (error) {
    console.error("Error getting conditions:", error);
    res.status(500).json({ error: "Failed to get conditions" });
  }
};

// Get condition by ID - following the structure in app.py
export const getConditionById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const condition = uniqueConditions.find(c => c.id === id);
    
    if (condition) {
      res.json(condition);
    } else {
      // If not found by ID, try to match by name pattern
      const [type, ...parts] = id.split("-");
      const namePattern = parts.join(" ");
      
      const matchedCondition = uniqueConditions.find(c => 
        c.type === type || c.type === 'both' && 
        c.name.toLowerCase().includes(namePattern)
      );
      
      if (matchedCondition) {
        res.json(matchedCondition);
      } else {
        res.status(404).json({ error: "Condition not found" });
      }
    }
  } catch (error) {
    console.error("Error getting condition:", error);
    res.status(500).json({ error: "Failed to get condition" });
  }
};

// Search conditions - following the original eligibility.js and app.py behavior
export const searchConditions = (req: Request, res: Response) => {
  try {
    const { query, quoteType } = req.query;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    const searchQuery = query.toLowerCase();
    let matchedConditions;
    
    // Get JSON data based on quoteType
    const jsonData = quoteType === 'fex' ? fexData.FEX.Conditions : termData.Term.Conditions;
    console.log(`Searching in ${quoteType === 'fex' ? 'FEX' : 'Term'} JSON data`);
    
    // Direct search in the JSON data structure based on quoteType
    // This directly mimics how the original app.py does its search
    if (quoteType === 'term' || quoteType === 'fex') {
      // Search directly in the original JSON structure
      const directMatches = [];
      
      for (const [conditionName, conditionData] of Object.entries(jsonData)) {
        if (conditionName.toLowerCase().includes(searchQuery)) {
          // Format the match with the same structure expected by the frontend
          const conditionId = `${quoteType}-${conditionName.toLowerCase().replace(/\s+/g, "-")}`;
          directMatches.push({
            id: conditionId,
            name: conditionName,
            type: quoteType as 'term' | 'fex',
            questions: (conditionData as any).questions || [],
            finalResults: (conditionData as any).finalResults || []
          });
        }
      }
      
      matchedConditions = directMatches;
      console.log(`Directly found ${matchedConditions.length} ${quoteType} conditions matching "${query}"`);
    } else {
      // If no quoteType, search all conditions (fallback)
      matchedConditions = uniqueConditions.filter(c => 
        c.name.toLowerCase().includes(searchQuery)
      );
      console.log(`Fallback: Found ${matchedConditions.length} conditions matching "${query}"`);
    }
    
    // Log more details about what was found
    if (matchedConditions.length > 0) {
      // Extract carrier information from the first condition for debugging
      const carriers = new Set<string>();
      
      if (matchedConditions[0].finalResults) {
        matchedConditions[0].finalResults.forEach((finalResult: any) => {
          if (finalResult.underwriting) {
            finalResult.underwriting.forEach((uw: any) => {
              if (uw.company) carriers.add(uw.company);
            });
          }
        });
      }
      
      console.log("First matching condition:", {
        name: matchedConditions[0].name,
        type: matchedConditions[0].type,
        questions: matchedConditions[0].questions.length,
        finalResults: matchedConditions[0].finalResults.length,
        carriers: Array.from(carriers)
      });
    }
    
    res.json(matchedConditions);
  } catch (error) {
    console.error("Error searching conditions:", error);
    res.status(500).json({ error: "Failed to search conditions" });
  }
};