import type { Request, Response } from "express";
import { db } from "../db";
import fs from "fs";
import path from "path";

// Load term and fex data from JSON files
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

interface QuoteRequest {
  faceAmount: number;
  birthday: string;
  gender: string;
  tobacco: string;
  termLength?: string;
  underwritingClass?: string;
  state: string;
  quoteType: "term" | "fex";
  healthConditions: Array<{
    id: string;
    name: string;
    answers: Record<string, string>;
  }>;
}

export const getQuotes = async (req: Request, res: Response) => {
  try {
    const {
      faceAmount,
      birthday,
      gender,
      tobacco,
      termLength,
      underwritingClass,
      state,
      quoteType,
      healthConditions,
    } = req.body as QuoteRequest;

    // Calculate age from birthday
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Apply eligibility checks based on health conditions
    let eligibleCarriers: string[] = [];
    
    if (quoteType === "term") {
      // Check term eligibility based on health conditions
      // For each condition, check the final result based on answers
      if (healthConditions.length === 0) {
        // If no conditions, all carriers are eligible
        eligibleCarriers = getAllCarrierNames("term");
      } else {
        // Process health conditions for eligibility
        const conditionResults = processHealthConditions(healthConditions, "term");
        eligibleCarriers = conditionResults;
      }
    } else {
      // Similar process for FEX
      if (healthConditions.length === 0) {
        eligibleCarriers = getAllCarrierNames("fex");
      } else {
        const conditionResults = processHealthConditions(healthConditions, "fex");
        eligibleCarriers = conditionResults;
      }
    }

    // Get carrier preferences from headers or body
    const carrierPreferences = req.headers["x-carrier-preferences"] 
      ? JSON.parse(req.headers["x-carrier-preferences"] as string)
      : null;

    // Filter out carriers based on preferences
    if (carrierPreferences) {
      eligibleCarriers = eligibleCarriers.filter(carrier => 
        carrierPreferences[carrier] === true
      );
    }

    // Generate quotes based on quote type and eligibility
    const quotes = generateQuotes({
      quoteType,
      eligibleCarriers,
      faceAmount,
      age,
      gender,
      tobacco,
      termLength,
      underwritingClass,
      state,
    });

    res.json(quotes);
  } catch (error) {
    console.error("Error generating quotes:", error);
    res.status(500).json({ error: "Failed to generate quotes" });
  }
};

function getAllCarrierNames(quoteType: "term" | "fex"): string[] {
  // Return all carrier names based on quote type
  if (quoteType === "term") {
    const allCarriers = new Set<string>();
    Object.values(termData.Term.Conditions).forEach((condition: any) => {
      condition.finalResults.forEach((finalResult: any) => {
        finalResult.underwriting.forEach((uw: any) => {
          allCarriers.add(uw.company);
        });
      });
    });
    return Array.from(allCarriers);
  } else {
    const allCarriers = new Set<string>();
    Object.values(fexData.FEX.Conditions).forEach((condition: any) => {
      condition.finalResults.forEach((finalResult: any) => {
        finalResult.underwriting.forEach((uw: any) => {
          allCarriers.add(uw.company);
        });
      });
    });
    return Array.from(allCarriers);
  }
}

function processHealthConditions(
  healthConditions: Array<{
    id: string;
    name: string;
    answers: Record<string, string>;
  }>,
  quoteType: "term" | "fex"
): string[] {
  // This is a simplified version - the actual logic would be more complex
  const data = quoteType === "term" ? termData.Term.Conditions : fexData.FEX.Conditions;
  
  const eligibleCarriers = new Set<string>();
  const ineligibleCarriers = new Set<string>();
  
  healthConditions.forEach(condition => {
    const conditionData = data[condition.name];
    if (!conditionData) return;
    
    // Find which final result this condition leads to based on answers
    let currentQuestionId = conditionData.questions[0].id;
    let finalResultId = "";
    
    while (!finalResultId.startsWith("final")) {
      const question = conditionData.questions.find((q: any) => q.id === currentQuestionId);
      if (!question) break;
      
      const answer = question.answers.find(
        (a: any) => a.value === condition.answers[question.id]
      );
      
      if (!answer) break;
      finalResultId = answer.nextQuestionId;
      
      if (!finalResultId.startsWith("final")) {
        currentQuestionId = finalResultId;
      }
    }
    
    if (finalResultId.startsWith("final")) {
      const finalResult = conditionData.finalResults.find((fr: any) => fr.id === finalResultId);
      if (finalResult) {
        finalResult.underwriting.forEach((uw: any) => {
          if (uw.status === "Approved") {
            eligibleCarriers.add(uw.company);
          } else if (uw.status === "Decline") {
            ineligibleCarriers.add(uw.company);
          }
        });
      }
    }
  });
  
  // Remove any carrier that is ineligible from any condition
  return Array.from(eligibleCarriers).filter(carrier => !ineligibleCarriers.has(carrier));
}

function generateQuotes({
  quoteType,
  eligibleCarriers,
  faceAmount,
  age,
  gender,
  tobacco,
  termLength,
  underwritingClass,
  state,
}: {
  quoteType: "term" | "fex";
  eligibleCarriers: string[];
  faceAmount: number;
  age: number;
  gender: string;
  tobacco: string;
  termLength?: string;
  underwritingClass?: string;
  state: string;
}) {
  // This would normally query a premium database or API
  // For now, we'll generate some sample quotes
  
  const quotes = eligibleCarriers.map((carrier, index) => {
    // Enhanced premium calculation with individualized rates
    // Base premium varies by carrier and has slight variation
    const basePremium = faceAmount / 1000 * (0.1 + (index * 0.01));
    const ageFactor = Math.max(1.0, age / 35); // More realistic age impact
    const genderFactor = gender === "male" ? 1.2 : 1.0;
    const tobaccoFactor = tobacco === "yes" ? 1.8 : 1.0;
    
    let termFactor = 1.0;
    if (quoteType === "term" && termLength) {
      // Longer terms are more expensive
      termFactor = (parseInt(termLength) / 10) * 1.2;
    }
    
    let uwFactor = 1.0;
    if (quoteType === "fex" && underwritingClass) {
      uwFactor = underwritingClass === "level" ? 1.0 :
                underwritingClass === "graded/modified" ? 1.3 :
                underwritingClass === "guaranteed" ? 1.8 : 1.5; // Higher factor for guaranteed issue
    }
    
    // Create more realistic variations in premium
    const baseVariation = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1 variation factor
    const monthlyPremium = basePremium * ageFactor * genderFactor * tobaccoFactor * termFactor * uwFactor * baseVariation;
    const annualPremium = monthlyPremium * 12;
    
    // Determine plan name and benefits
    let planName, tierName, benefits;
    
    if (quoteType === "term") {
      planName = `${carrier} ${termLength}-Year Term`;
      tierName = tobacco === "yes" ? "Tobacco" : "Preferred";
      benefits = [
        "Terminal Illness",
        ...(Math.random() > 0.5 ? ["Critical Illness"] : []),
        ...(Math.random() > 0.7 ? ["Chronic Illness"] : []),
      ];
    } else {
      planName = `${carrier} Final Expense`;
      tierName = underwritingClass === "level" ? "Level" :
                underwritingClass === "graded/modified" ? "Graded" : 
                underwritingClass === "guaranteed" ? "Guaranteed Issue" : "Limited Pay";
      benefits = [
        "Terminal Illness",
        ...(Math.random() > 0.6 ? ["Confined Care"] : []),
        ...(underwritingClass === "guaranteed" ? ["No Health Questions"] : []),
      ];
    }
    
    // Log premium calculation factors for debugging
    console.log(`Quote for ${carrier}: Age=${age}, Gender=${gender}, FaceAmount=${faceAmount}, Term=${termLength || 'N/A'}`);
    
    return {
      carrier,
      planName,
      tierName,
      monthlyPremium: parseFloat(monthlyPremium.toFixed(2)),  // Round to 2 decimal places
      annualPremium: parseFloat((monthlyPremium * 12).toFixed(2)),
      benefits,
    };
  });
  
  return quotes;
}
