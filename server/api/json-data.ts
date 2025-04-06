import { Request, Response } from "express";
import fs from "fs";
import path from "path";

// Load term and fex data from JSON files
const termFile = path.join(import.meta.dirname, "../../attached_assets/fixed_termsheet.json");
const fexFile = path.join(import.meta.dirname, "../../attached_assets/fixed_fexsheet.json");

// Serve the term sheet JSON
export const getTermSheet = (req: Request, res: Response) => {
  try {
    const termData = JSON.parse(fs.readFileSync(termFile, "utf8"));
    res.json(termData);
  } catch (error) {
    console.error("Error loading term data:", error);
    res.status(500).json({ error: "Failed to load term data" });
  }
};

// Serve the FEX sheet JSON
export const getFexSheet = (req: Request, res: Response) => {
  try {
    const fexData = JSON.parse(fs.readFileSync(fexFile, "utf8"));
    res.json(fexData);
  } catch (error) {
    console.error("Error loading fex data:", error);
    res.status(500).json({ error: "Failed to load fex data" });
  }
};