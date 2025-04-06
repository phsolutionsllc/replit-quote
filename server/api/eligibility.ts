import type { Request, Response } from "express";
import fs from "fs";
import path from "path";

// Load condition data
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

// Get all available conditions
export const getConditions = (req: Request, res: Response) => {
  try {
    const conditions = [];
    
    // Get Term conditions
    for (const conditionName in termData.Term.Conditions) {
      conditions.push({
        id: `term-${conditionName.replace(/\s+/g, "-").toLowerCase()}`,
        name: conditionName,
        type: "term",
        questions: termData.Term.Conditions[conditionName].questions,
      });
    }
    
    // Get FEX conditions
    for (const conditionName in fexData.FEX.Conditions) {
      // Check if this condition is already in the list from Term
      const existingCondition = conditions.find(c => c.name === conditionName);
      
      if (existingCondition) {
        // Condition exists in both Term and FEX
        existingCondition.type = "both";
      } else {
        conditions.push({
          id: `fex-${conditionName.replace(/\s+/g, "-").toLowerCase()}`,
          name: conditionName,
          type: "fex",
          questions: fexData.FEX.Conditions[conditionName].questions,
        });
      }
    }
    
    res.json(conditions);
  } catch (error) {
    console.error("Error getting conditions:", error);
    res.status(500).json({ error: "Failed to get conditions" });
  }
};

// Get condition by ID
export const getConditionById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [type, conditionSlug] = id.split("-");
    
    // Convert slug back to condition name
    const conditionNameWords = conditionSlug.split("-").map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    );
    
    // Try different name variations to match the condition
    let condition = null;
    let data = type === "term" ? termData.Term.Conditions : fexData.FEX.Conditions;
    
    // Check exact name match
    const conditionName = conditionNameWords.join(" ");
    if (data[conditionName]) {
      condition = {
        id,
        name: conditionName,
        type,
        questions: data[conditionName].questions,
      };
    }
    
    // If not found, try iterating through all condition names to find a partial match
    if (!condition) {
      for (const name in data) {
        if (name.toLowerCase().includes(conditionSlug.replace(/-/g, " "))) {
          condition = {
            id,
            name,
            type,
            questions: data[name].questions,
          };
          break;
        }
      }
    }
    
    if (condition) {
      res.json(condition);
    } else {
      res.status(404).json({ error: "Condition not found" });
    }
  } catch (error) {
    console.error("Error getting condition:", error);
    res.status(500).json({ error: "Failed to get condition" });
  }
};

// Search conditions
export const searchConditions = (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    const conditions = [];
    const searchTerms = query.toLowerCase().split(" ");
    
    // Search Term conditions
    for (const conditionName in termData.Term.Conditions) {
      const lowerName = conditionName.toLowerCase();
      
      if (searchTerms.every(term => lowerName.includes(term))) {
        conditions.push({
          id: `term-${conditionName.replace(/\s+/g, "-").toLowerCase()}`,
          name: conditionName,
          type: "term",
          questions: termData.Term.Conditions[conditionName].questions,
        });
      }
    }
    
    // Search FEX conditions
    for (const conditionName in fexData.FEX.Conditions) {
      const lowerName = conditionName.toLowerCase();
      
      if (searchTerms.every(term => lowerName.includes(term))) {
        // Check if this condition is already in the list from Term
        const existingCondition = conditions.find(c => c.name === conditionName);
        
        if (existingCondition) {
          // Condition exists in both Term and FEX
          existingCondition.type = "both";
        } else {
          conditions.push({
            id: `fex-${conditionName.replace(/\s+/g, "-").toLowerCase()}`,
            name: conditionName,
            type: "fex",
            questions: fexData.FEX.Conditions[conditionName].questions,
          });
        }
      }
    }
    
    res.json(conditions);
  } catch (error) {
    console.error("Error searching conditions:", error);
    res.status(500).json({ error: "Failed to search conditions" });
  }
};
