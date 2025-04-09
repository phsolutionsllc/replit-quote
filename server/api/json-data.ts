import { Request, Response } from "express";
import { db } from "../db";
import { termQuotes, fexQuotes } from "../../shared/schema";

// Serve the term sheet JSON by querying the Neon database
export const getTermSheet = async (req: Request, res: Response) => {
  try {
    // Query all term data from the 'term' table in the Neon database
    const termData = await db.select().from(termQuotes);
    
    res.json(termData);
  } catch (error) {
    console.error("Error loading term data from database:", error);
    res.status(500).json({ error: "Failed to load term data" });
  }
};

// Serve the FEX sheet JSON by querying the Neon database
export const getFexSheet = async (req: Request, res: Response) => {
  try {
    // Query all fex data from the 'fex' table in the Neon database
    const fexData = await db.select().from(fexQuotes);
    
    res.json(fexData);
  } catch (error) {
    console.error("Error loading fex data from database:", error);
    res.status(500).json({ error: "Failed to load fex data" });
  }
};