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
  console.log("Successfully loaded Term conditions:", Object.keys(termData.Term.Conditions).length);
} catch (error) {
  console.error("Error loading term data:", error);
}

try {
  fexData = JSON.parse(fs.readFileSync(fexFile, "utf8"));
  console.log("Successfully loaded FEX conditions:", Object.keys(fexData.FEX.Conditions).length);
} catch (error) {
  console.error("Error loading fex data:", error);
}

// Define condition type
interface Condition {
  id: string;
  name: string;
  type: "term" | "fex" | "both";
  questions: any[];
}

// Get all available conditions
export const getConditions = (req: Request, res: Response) => {
  try {
    const conditions: Condition[] = [];
    
    // Process Term conditions
    if (termData && termData.Term && termData.Term.Conditions) {
      const termConditions = termData.Term.Conditions;
      Object.keys(termConditions).forEach(conditionName => {
        const conditionData = termConditions[conditionName];
        if (conditionData && conditionData.questions) {
          conditions.push({
            id: `term-${conditionName.toLowerCase().replace(/\s+/g, "-")}`,
            name: conditionName,
            type: "term",
            questions: conditionData.questions,
          });
        }
      });
    }
    
    // Process FEX conditions
    if (fexData && fexData.FEX && fexData.FEX.Conditions) {
      const fexConditions = fexData.FEX.Conditions;
      Object.keys(fexConditions).forEach(conditionName => {
        const conditionData = fexConditions[conditionName];
        if (conditionData && conditionData.questions) {
          // Check if this condition already exists in the list (from Term)
          const existingIndex = conditions.findIndex(c => c.name === conditionName);
          
          if (existingIndex >= 0) {
            // Update existing condition to be of type "both"
            conditions[existingIndex].type = "both";
          } else {
            // Add new FEX-only condition
            conditions.push({
              id: `fex-${conditionName.toLowerCase().replace(/\s+/g, "-")}`,
              name: conditionName,
              type: "fex",
              questions: conditionData.questions,
            });
          }
        }
      });
    }
    
    console.log(`Returning ${conditions.length} conditions`);
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
    const [type, ...parts] = id.split("-");
    const conditionSlug = parts.join("-");
    
    // Find the condition in the appropriate data structure
    const dataSource = type === "term" ? termData.Term.Conditions : fexData.FEX.Conditions;
    let foundCondition = null;
    
    // Try to find the condition by matching the slug with the name
    for (const name in dataSource) {
      if (name.toLowerCase().replace(/\s+/g, "-") === conditionSlug) {
        foundCondition = {
          id,
          name,
          type,
          questions: dataSource[name].questions,
        };
        break;
      }
    }
    
    // If we couldn't find an exact match, try a partial match
    if (!foundCondition) {
      for (const name in dataSource) {
        if (name.toLowerCase().includes(conditionSlug.replace(/-/g, " "))) {
          foundCondition = {
            id,
            name,
            type,
            questions: dataSource[name].questions,
          };
          break;
        }
      }
    }
    
    if (foundCondition) {
      res.json(foundCondition);
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
    
    const searchQuery = query.toLowerCase();
    const conditions: Condition[] = [];
    
    // Search in Term conditions
    if (termData && termData.Term && termData.Term.Conditions) {
      Object.keys(termData.Term.Conditions).forEach(name => {
        if (name.toLowerCase().includes(searchQuery)) {
          conditions.push({
            id: `term-${name.toLowerCase().replace(/\s+/g, "-")}`,
            name,
            type: "term",
            questions: termData.Term.Conditions[name].questions,
          });
        }
      });
    }
    
    // Search in FEX conditions
    if (fexData && fexData.FEX && fexData.FEX.Conditions) {
      Object.keys(fexData.FEX.Conditions).forEach(name => {
        if (name.toLowerCase().includes(searchQuery)) {
          // Check if this condition already exists in the list (from Term)
          const existingIndex = conditions.findIndex(c => c.name === name);
          
          if (existingIndex >= 0) {
            // Update existing condition to be of type "both"
            conditions[existingIndex].type = "both";
          } else {
            // Add new FEX-only condition
            conditions.push({
              id: `fex-${name.toLowerCase().replace(/\s+/g, "-")}`,
              name,
              type: "fex",
              questions: fexData.FEX.Conditions[name].questions,
            });
          }
        }
      });
    }
    
    console.log(`Found ${conditions.length} conditions matching "${query}"`);
    res.json(conditions);
  } catch (error) {
    console.error("Error searching conditions:", error);
    res.status(500).json({ error: "Failed to search conditions" });
  }
};