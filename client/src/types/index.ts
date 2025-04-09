// Quote Parameters
export interface QuoteParameters {
  faceAmount: number | string;  // Can be a string with commas like "100,000"
  age: number;
  birthday?: string; // Optional: used only for age calculation
  gender: string;
  tobacco: string;
  termLength?: string;
  underwritingClass?: string;
  state: string;
}

// Condition Types
export interface ConditionAnswer {
  value: string;
  nextQuestionId: string;
}

export interface ConditionQuestion {
  id: string;
  questionText: string;
  questionType: "date" | "yesNo" | "text";
  answers: ConditionAnswer[];
}

export interface Condition {
  id: string;
  name: string;
  type?: "term" | "fex" | "both";
  questions: ConditionQuestion[];
  finalResults?: any[];
  answers?: Record<string, string>;
}

// Quote Types
export interface Quote {
  carrier: string;
  planName: string;
  tierName: string;
  monthlyPremium: number;
  annualPremium: number;
  benefits?: string[];
  decline?: boolean;
  declineReason?: string | null;
  eapp?: string | null;  // E-App URL from the database
}

// Carrier Types
export interface Carrier {
  id: string;
  name: string;
  type: "term" | "fex" | "both";
}

// Plan and Tier Types
export interface Plan {
  id: string;
  carrier: string;
  name: string;
  type: "term" | "fex";
  tiers: Tier[];
}

export interface Tier {
  id: string;
  name: string;
  requirements: Record<string, string>;
  benefits: string[];
}

// State Type
export interface State {
  code: string;
  name: string;
}
