import { Request, Response } from "express";
import { db, timedQuery, explainQuery, executeFastQuery } from "../db";
import { performance } from 'perf_hooks';

interface QuoteRequest {
  faceAmount: number | string;
  face_amount: number | string;
  age: number;
  sex: string;
  gender: string;
  tobacco: string;
  termLength?: string;
  term_length?: string;
  underwritingClass?: string;
  uw_class?: string;
  state: string;
  selected_database: "term" | "fex";
  quoteType?: "term" | "fex";
  healthConditions: Array<{
    id: string;
    name: string;
    answers: Record<string, string>;
  }>;
}

interface TransformedQuote {
  id: number;
  carrier: string;
  planName: string;
  tierName: string;
  monthlyPremium: number;
  annualPremium: number;
  warnings?: string | null;
  logoUrl?: string | null;
  eapp?: string | null;
}

// Helper function to parse face amount and remove commas
function parseNumeric(value: any): number {
  if (typeof value === 'number') return value;
  
  // If it's a string, remove commas and convert to number
  if (typeof value === 'string') {
    return parseInt(value.replace(/,/g, ''), 10);
  }
  
  return 0; // Default fallback
}

export const getQuotes = async (req: Request, res: Response) => {
  const overallStart = performance.now();
  console.log('[QUOTES] Starting quote generation process');
  
  try {
    // Dump the raw request body for debugging
    console.log('[QUOTES] Raw request body:', JSON.stringify(req.body));
    
    const parseStart = performance.now();
    // Normalize field names from different client naming conventions
    const {
      age,
      sex,
      gender, // Some clients might send gender instead of sex
      faceAmount,
      face_amount,
      selected_database,
      quoteType,
      tobacco,
      termLength,
      term_length,
      underwritingClass,
      uw_class,
      state = "Texas" // Default to Texas if not provided
    } = req.body;

    // Normalize all fields - Log all values for debugging
    console.log('[QUOTES] Input values:', {
      age, sex, gender, faceAmount, face_amount, 
      selected_database, quoteType, tobacco, 
      termLength, term_length, underwritingClass, uw_class, state
    });

    // Use exact values for sex/gender that match the database - always "Male" or "Female"
    let normalizedSex = 'Male'; // Default
    if (sex === 'Female' || gender === 'Female') {
      normalizedSex = 'Female';
    } else if (sex === 'Male' || gender === 'Male') {
      normalizedSex = 'Male';
    }
    
    // Parse face amount
    const normalizedFaceAmount = parseNumeric(faceAmount || face_amount);
    
    // Database type
    const normalizedDatabase = selected_database || quoteType || 'term';
    
    // State - providing default value of Texas from the sample data
    const normalizedState = state || "Texas";

    // Age value
    const normalizedAge = Number(age) || 35; // Default to 35 if age not provided

    // Term length - make sure it's a string like "10", "20", etc.
    const normalizedTermLength = String(termLength || term_length || '20'); // Default to 20 if term length not provided
    
    // UW class
    const normalizedUwClass = underwritingClass || uw_class || 'level';
    
    // Use exact tobacco values that match the database - "None" or "Cigarettes"
    let normalizedTobacco = 'None'; // Default
    if (tobacco === 'Cigarettes') {
      normalizedTobacco = 'Cigarettes';
    }

    const parseEnd = performance.now();
    console.log('[QUOTES] Parameter normalization completed in', (parseEnd - parseStart).toFixed(2), 'ms');
    console.log('[QUOTES] Normalized values:', {
      age: normalizedAge,
      sex: normalizedSex,
      faceAmount: normalizedFaceAmount,
      selected_database: normalizedDatabase,
      tobacco: normalizedTobacco,
      termLength: normalizedTermLength,
      state: normalizedState,
      underwritingClass: normalizedUwClass
    });
    
    const queryBuildStart = performance.now();
    let query;
    let params;
    
    // Stick closely to the original Python app's query format and match the sample data
    if (normalizedDatabase === 'term') {
      query = `
        SELECT id, face_amount, sex, term_length, state, age, tobacco,
               company, plan_name, tier_name, monthly_rate, annual_rate,
               warnings, logo_url, eapp
        FROM term
        WHERE face_amount = $1
        AND sex = $2
        AND age = $3
        AND tobacco = $4
        AND term_length = $5
        ORDER BY monthly_rate ASC
      `;
      params = [normalizedFaceAmount, normalizedSex, normalizedAge, normalizedTobacco, normalizedTermLength];
    } else {
      query = `
        SELECT id, face_amount, sex, state, age, tobacco, underwriting_class,
               company, plan_name, tier_name, monthly_rate, annual_rate,
               warnings, logo_url, eapp
        FROM fex
        WHERE face_amount = $1
        AND sex = $2
        AND age = $3
        AND tobacco = $4
        AND underwriting_class = $5
        ORDER BY monthly_rate ASC
      `;
      params = [normalizedFaceAmount, normalizedSex, normalizedAge, normalizedTobacco, normalizedUwClass];
    }
    
    const queryBuildEnd = performance.now();
    console.log('[QUOTES] Query built in', (queryBuildEnd - queryBuildStart).toFixed(2), 'ms');
    console.log(`[QUOTES] Query: ${query}`);
    console.log(`[QUOTES] Params: ${JSON.stringify(params)}`);
    
    // Run an EXPLAIN ANALYZE before actual execution to diagnose performance issues
    try {
      console.log('[QUOTES] Running query analysis...');
      const explainStart = performance.now();
      await explainQuery(query, params);
      const explainEnd = performance.now();
      console.log(`[QUOTES] Query analysis took ${(explainEnd - explainStart).toFixed(2)}ms`);
    } catch (explainError) {
      console.error('[QUOTES] Error during query analysis:', explainError);
    }
    
    // Use the dedicated connection for query execution
    console.log('[QUOTES] Executing actual query with dedicated connection...');
    const queryExecStart = performance.now();
    const queryResult = await executeFastQuery(query, params);
    const queryExecEnd = performance.now();
    console.log(`[QUOTES] Total query execution time: ${(queryExecEnd - queryExecStart).toFixed(2)}ms`);
    
    const transformStart = performance.now();
    // Add detailed logging before transformation
    console.log('[QUOTES] First row raw structure:', queryResult.rows[0] ? Object.keys(queryResult.rows[0]) : 'No results');
    if (queryResult.rows[0]) {
      console.log(`[QUOTES] Sample row values (${normalizedDatabase}):`, {
        id: queryResult.rows[0].id,
        company: queryResult.rows[0].company,
        monthly_rate: queryResult.rows[0].monthly_rate,
        annual_rate: queryResult.rows[0].annual_rate
      });
    }
    
    // Map database field names to what the front-end expects
    const transformedQuotes: TransformedQuote[] = queryResult.rows.map((quote) => ({
      id: quote.id,
      carrier: quote.company,
      planName: quote.plan_name,
      tierName: quote.tier_name,
      monthlyPremium: Number(quote.monthly_rate),
      annualPremium: Number(quote.annual_rate),
      warnings: quote.warnings,
      logoUrl: quote.logo_url,
      eapp: quote.eapp
    }));
    
    // Add detailed logging after transformation
    console.log('[QUOTES] First transformed quote structure:', transformedQuotes[0] ? Object.keys(transformedQuotes[0]) : 'No results');
    if (transformedQuotes[0]) {
      console.log('[QUOTES] Sample transformed values:', {
        id: transformedQuotes[0].id,
        carrier: transformedQuotes[0].carrier,
        monthlyPremium: transformedQuotes[0].monthlyPremium,
        annualPremium: transformedQuotes[0].annualPremium
      });
    }
    
    const transformEnd = performance.now();
    console.log('[QUOTES] Transformed', transformedQuotes.length, 'quotes in', 
      (transformEnd - transformStart).toFixed(2), 'ms');
    
    const overallEnd = performance.now();
    console.log('[QUOTES] Total quote generation time:', (overallEnd - overallStart).toFixed(2), 'ms');
    
    res.json(transformedQuotes);
  } catch (error) {
    const failEnd = performance.now();
    console.error('[QUOTES] Error generating quotes:', error);
    console.error('[QUOTES] Failed after', (failEnd - overallStart).toFixed(2), 'ms');
    res.status(500).json({ error: 'Failed to generate quotes' });
  }
};