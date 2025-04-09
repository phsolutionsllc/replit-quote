import { useState, useEffect } from "react";
import QuoteBuilder from "@/components/QuoteBuilder";
import QuoteResults from "@/components/QuoteResults";
import HealthConditionModal from "@/components/HealthConditionModal";
import CarrierPreferencesModal from "@/components/CarrierPreferencesModal";
import { QuoteParameters, Condition, Quote } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Declare completedConditions on window
declare global {
  interface Window {
    completedConditions: Record<string, any>;
  }
}

const Home = () => {
  const [quoteType, setQuoteType] = useState<"term" | "fex">("term");
  const [showResults, setShowResults] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [quoteResults, setQuoteResults] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [healthConditions, setHealthConditions] = useState<Condition[]>([]);
  const [completedConditions, setCompletedConditions] = useState<Record<string, any>>({});
  const { toast } = useToast();

  // Initialize window.completedConditions on component mount
  useEffect(() => {
    if (!window.completedConditions) {
      window.completedConditions = {};
    }
    
    // If window.completedConditions has data, sync it to our state
    if (Object.keys(window.completedConditions).length > 0) {
      setCompletedConditions(window.completedConditions);
      
      // Also recreate healthConditions array from completedConditions
      const conditionsFromWindow = Object.entries(window.completedConditions).map(([name, data]) => {
        return {
          id: `${quoteType}-${name.toLowerCase().replace(/\s+/g, "-")}`,
          name,
          type: quoteType,
          questions: [],
          answers: (data as any).responses || {}
        };
      });
      
      if (conditionsFromWindow.length > 0) {
        setHealthConditions(conditionsFromWindow);
      }
    }
  }, []);

  // Keep window.completedConditions in sync with our state
  useEffect(() => {
    window.completedConditions = completedConditions;
    console.log("Updated window.completedConditions:", window.completedConditions);
  }, [completedConditions]);

  const handleQuoteSubmit = async (parameters: QuoteParameters) => {
    console.log('[DEBUG] handleQuoteSubmit triggered in Home.tsx');
    const startTime = performance.now();
    console.log('[PERF] Quote submission started');
    
    setIsLoading(true);
    try {
      // Create the request payload, making sure we send age instead of birthday
      // Use destructuring to exclude the birthday field
      const { birthday, ...payloadWithoutBirthday } = parameters;
      
      // Log the actual received parameters to debug form values
      console.log('[DEBUG] Received parameters from form:', parameters);
      
      // Convert faceAmount to a clean number for the API if it's not already a number
      let faceAmount: number;
      if (typeof parameters.faceAmount === 'string') {
        faceAmount = parseInt(parameters.faceAmount.replace(/,/g, ''), 10);
      } else if (typeof parameters.faceAmount === 'number') {
        faceAmount = parameters.faceAmount;
      } else {
        // Default if undefined or null
        faceAmount = 100000; // Default to $100,000
        console.warn('[DEBUG] No face amount provided, using default:', faceAmount);
      }
      console.log('[DEBUG] Parsed faceAmount:', faceAmount);
      
      // Map gender to sex (db expects 'sex', frontend uses 'gender')
      // Adding null check to prevent charAt error
      const sex = parameters.gender ? 
        (parameters.gender === 'Male' || parameters.gender === 'Female' ? parameters.gender : 'Male') : 
        'Male'; // Default to 'Male' if gender is undefined
      console.log('[DEBUG] Normalized sex/gender:', sex);
        
      // Normalize tobacco value - use exact values that match the database
      let tobacco = parameters.tobacco || 'None';
      if (tobacco !== 'None' && tobacco !== 'Cigarettes') {
        tobacco = 'None'; // Default to None for anything that's not exactly Cigarettes
      }
      console.log('[DEBUG] Normalized tobacco:', tobacco);
      
      // Include completedConditions data in the request
      const medicalConditions = Object.keys(completedConditions);
      const medicalResponses = completedConditions;
      
      // Make sure we're sending the proper fields that the API expects
      const requestPayload = {
        ...payloadWithoutBirthday,
        sex, // Map 'gender' to 'sex' as expected by API, with proper capitalization
        gender: sex, // Include both to ensure compatibility
        tobacco, // Properly capitalized
        state: parameters.state || 'Texas', // Provide default state if not specified
        face_amount: faceAmount, // Map our faceAmount to what the API expects as face_amount
        faceAmount, // Include both to ensure compatibility
        selected_database: quoteType, // Use selected_database as expected by the API
        quoteType, // Include both to ensure compatibility
        term_length: parameters.termLength, // Using snake_case field name to match API expectations
        termLength: parameters.termLength, // Include both to ensure compatibility
        underwriting_class: parameters.underwritingClass, // Using snake_case field name
        underwritingClass: parameters.underwritingClass, // Include both to ensure compatibility
        medical_conditions: medicalConditions,
        medical_responses: medicalResponses,
        healthConditions, // Include our healthConditions array too
        age: Number(parameters.age), // Ensure age is a number
      };

      // Add more detailed console logging
      const beforeFetchTime = performance.now();
      console.log('[PERF] Request preparation took:', (beforeFetchTime - startTime).toFixed(2), 'ms');
      console.log('[DEBUG] About to fetch quotes from API');
      console.log('[DEBUG] QuoteParameters from form:', parameters);
      console.log('[DEBUG] Medical conditions:', medicalConditions);
      console.log('[DEBUG] Full request payload:', requestPayload);

      try {
        console.log('[DEBUG] Starting fetch request to /api/quotes');
        const fetchStartTime = performance.now();
        const response = await fetch("/api/quotes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });
        
        const fetchEndTime = performance.now();
        console.log('[PERF] Fetch request took:', (fetchEndTime - fetchStartTime).toFixed(2), 'ms');
        console.log('[DEBUG] Fetch request completed, status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('[DEBUG] API request failed:', errorData);
          throw new Error(errorData.error || "Failed to fetch quotes");
        }
        
        const parseStartTime = performance.now();
        const data = await response.json();
        const parseEndTime = performance.now();
        console.log('[PERF] JSON parsing took:', (parseEndTime - parseStartTime).toFixed(2), 'ms');
        console.log("[DEBUG] Successfully got response data");
        console.log("Raw quote data from API:", data);
        
        // NEW: Normalize data to ensure proper field names
        const normalizedData = data.map((quote: any) => {
          // Create a normalized quote object with expected field names
          const normalizedQuote: Record<string, any> = { ...quote };
          
          // Check for alternative field names and map them to expected fields
          if (normalizedQuote.monthlyPremium === undefined && normalizedQuote.monthlyRate !== undefined) {
            console.log(`[DEBUG] Found monthlyRate instead of monthlyPremium for ${quote.carrier}`);
            normalizedQuote.monthlyPremium = normalizedQuote.monthlyRate;
          }
          
          if (normalizedQuote.annualPremium === undefined && normalizedQuote.annualRate !== undefined) {
            console.log(`[DEBUG] Found annualRate instead of annualPremium for ${quote.carrier}`);
            normalizedQuote.annualPremium = normalizedQuote.annualRate;
          }
          
          // Convert any string amounts to numbers
          if (typeof normalizedQuote.monthlyPremium === 'string') {
            normalizedQuote.monthlyPremium = Number(normalizedQuote.monthlyPremium);
          }
          
          if (typeof normalizedQuote.annualPremium === 'string') {
            normalizedQuote.annualPremium = Number(normalizedQuote.annualPremium);
          }
          
          return normalizedQuote;
        });
        
        console.log("[DEBUG] Normalized quote data:", normalizedData);
        
        // Process quotes with our improved updateQuotesWithDeclineStatus function
        const processStart = performance.now();
        const processedResults = updateQuotesWithDeclineStatus(normalizedData, completedConditions);
        const processEnd = performance.now();
        console.log('[PERF] Processing results took:', (processEnd - processStart).toFixed(2), 'ms');
        console.log("Processed quote results:", processedResults);
        
        setQuoteResults(processedResults);
        setShowResults(true);
        setIsLoading(false);
        
        // Scroll to results
        setTimeout(() => {
          document.getElementById("quoteResults")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        
        const totalEnd = performance.now();
        console.log('[PERF] Total quote process time:', (totalEnd - startTime).toFixed(2), 'ms');
      } catch (fetchError) {
        console.error('[DEBUG] Error during fetch operation:', fetchError);
        throw fetchError; // re-throw to be caught by the outer catch
      }
    } catch (error: unknown) {
      console.error("[DEBUG] Error fetching quotes:", error);
      let errorMessage = "Failed to fetch quotes. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleConditionSelect = (condition: Condition) => {
    setSelectedCondition(condition);
    setShowHealthModal(true);
  };

  const handleConditionAnswersSubmit = (condition: Condition, answers: Record<string, string>) => {
    // Create an updated condition with answers
    const updatedCondition = { ...condition, answers };
    
    // Get the final result ID from the answers if available
    const finalResultId = answers._finalResultId;
    
    // Process the condition to store it with the proper structure for carrier checking
    let finalResults = null;
    let carriersResult = [];
    
    if (finalResultId && condition.finalResults) {
      // Find the specific final result with this ID
      const matchingResult = condition.finalResults.find(fr => fr.id === finalResultId);
      if (matchingResult) {
        // Check if underwriting array exists directly
        if (matchingResult.underwriting && Array.isArray(matchingResult.underwriting)) {
          carriersResult = matchingResult.underwriting;
          finalResults = {
            underwriting: matchingResult.underwriting
          };
          
          console.log(`Found underwriting results for condition ${condition.name}:`, carriersResult);
        }
      }
    }
    
    // Update healthConditions state
    const updatedConditions = [...healthConditions];
    const existingIndex = updatedConditions.findIndex(c => c.id === condition.id);
    
    if (existingIndex >= 0) {
      updatedConditions[existingIndex] = updatedCondition;
    } else {
      updatedConditions.push(updatedCondition);
    }
    
    setHealthConditions(updatedConditions);
    
    // Create updated completedConditions with this new condition
    const updatedCompletedConditions = {
      ...completedConditions,
      [condition.name]: {
        responses: answers,
        finalResults: finalResults,
        carriersResult: carriersResult // Add this for compatibility with both formats
      }
    };
    
    // Update completedConditions state
    setCompletedConditions(updatedCompletedConditions);
    
    // If we have active quotes, update their decline status
    if (quoteResults.length > 0) {
      console.log("Updating quotes with new condition:", condition.name);
      // Process existing quotes with the updated conditions
      const updatedQuotes = updateQuotesWithDeclineStatus(quoteResults, updatedCompletedConditions);
      console.log("Updated quotes after adding condition:", updatedQuotes);
      setQuoteResults(updatedQuotes);
    }
    
    setShowHealthModal(false);
  };

  const handleRemoveCondition = (conditionId: string) => {
    // Find the condition to remove
    const conditionToRemove = healthConditions.find(c => c.id === conditionId);
    
    if (conditionToRemove) {
      console.log(`Removing condition: ${conditionToRemove.name}`);
      
      // Remove from healthConditions array
      setHealthConditions(prevConditions => 
        prevConditions.filter(condition => condition.id !== conditionId)
      );
      
      // Also remove from completedConditions
      const updatedCompletedConditions = { ...completedConditions };
      delete updatedCompletedConditions[conditionToRemove.name];
      setCompletedConditions(updatedCompletedConditions);
      
      // If we have active quotes, update their decline status
      if (quoteResults.length > 0) {
        console.log("Updating quotes after removing condition:", conditionToRemove.name);
        // Process existing quotes with the updated conditions
        const updatedQuotes = updateQuotesWithDeclineStatus(quoteResults, updatedCompletedConditions);
        console.log("Updated quotes after removing condition:", updatedQuotes);
        setQuoteResults(updatedQuotes);
      }
    }
  };
  
  const handleCopyQuote = (quote: Quote) => {
    const quoteText = `
      Carrier: ${quote.carrier}
      Plan: ${quote.planName}
      Type: ${quote.tierName}
      ${quote.decline ? 'Status: Declined' : `Monthly Premium: $${quote.monthlyPremium}`}
      ${quote.decline ? `Reason: ${quote.declineReason}` : `Annual Premium: $${quote.annualPremium}`}
    `;
    
    navigator.clipboard.writeText(quoteText.trim());
    
    toast({
      title: "Quote Copied",
      description: "Quote details copied to clipboard!",
    });
  };

  const handleOpenEapp = (quote: Quote) => {
    // Don't allow eApp for declined quotes
    if (quote.decline) {
      toast({
        title: "Not Available",
        description: "E-App is not available for declined quotes.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if the quote has an eapp URL
    if (!quote.eapp) {
      toast({
        title: "No E-App Available",
        description: "This carrier doesn't have an e-application link available.",
        variant: "destructive"
      });
      return;
    }
    
    // Open the eapp URL from the database
    window.open(quote.eapp, "_blank");
  };

  const updateQuotesWithDeclineStatus = (
    quotes: Quote[],
    completedConditions: Record<string, any>
  ): Quote[] => {
    console.log("========== BEGIN DECLINE STATUS DEBUGGING ==========");
    
    // First, log all quote carriers for reference
    console.log("All quote carriers:", quotes.map(q => q.carrier));
    
    // Log completed conditions structure to understand what we're working with
    console.log("Completed conditions:", completedConditions);
    
    // Process each quote to check for decline status
    const processedQuotes = quotes.map((quote) => {
      const declineInfo = Object.entries(completedConditions).reduce<{ declined: boolean; reason: string | null }>(
        (result, [conditionName, conditionData]) => {
          if (result.declined) return result; // Already declined by another condition
          
          console.log(`Checking condition "${conditionName}" for carrier "${quote.carrier}"`);
          
          // Check multiple possible locations for carrier results
          let carrierResults = [];
          
          // Case 1: finalResults.underwriting structure
          if (conditionData.finalResults && conditionData.finalResults.underwriting) {
            console.log(`  Found underwriting data in finalResults for "${conditionName}"`);
            carrierResults = conditionData.finalResults.underwriting;
          } 
          // Case 2: carriersResult array structure (from the logs)
          else if (conditionData.carriersResult && Array.isArray(conditionData.carriersResult)) {
            console.log(`  Found carriersResult array for "${conditionName}"`);
            carrierResults = conditionData.carriersResult;
          }
          // None found
          else {
            console.log(`  No underwriting data for condition "${conditionName}"`);
            return result;
          }
          
          console.log(`  Carrier results for "${conditionName}":`, carrierResults);
          
          // Check each carrier result against this quote's carrier
          for (const carrierResult of carrierResults) {
            // Log full comparison details for debugging
            console.log(`  Comparing: Quote carrier "${quote.carrier}" with condition company "${carrierResult.company}"`);
            console.log(`  Case insensitive match: ${quote.carrier.toLowerCase() === carrierResult.company.toLowerCase()}`);
            console.log(`  Contains check: ${quote.carrier.toLowerCase().includes(carrierResult.company.toLowerCase()) || 
                                             carrierResult.company.toLowerCase().includes(quote.carrier.toLowerCase())}`);
            
            // Check if this carrier result applies to the current quote carrier
            // Try multiple matching approaches to find what works
            if (
              // Exact match (case insensitive)
              quote.carrier.toLowerCase() === carrierResult.company.toLowerCase() ||
              // Partial match (one contains the other)
              quote.carrier.toLowerCase().includes(carrierResult.company.toLowerCase()) ||
              carrierResult.company.toLowerCase().includes(quote.carrier.toLowerCase())
            ) {
              console.log(`  MATCH FOUND between "${quote.carrier}" and "${carrierResult.company}"`);
              
              // Check multiple possible field names for the decline status
              const decisionValue = carrierResult.decision || carrierResult.status || "";
              const isDeclined = decisionValue.toLowerCase() === "decline" || 
                                 decisionValue.toLowerCase() === "declined";
              
              if (isDeclined) {
                console.log(`  DECLINED: "${quote.carrier}" for condition "${conditionName}"`);
                console.log(`  Decline reason:`, carrierResult.reason || "No reason provided");
                
                return {
                  declined: true,
                  reason: carrierResult.reason || 
                          (carrierResult.details?.declineReason as string) || 
                          `Declined due to ${conditionName}`
                };
              }
              
              console.log(`  NOT DECLINED: "${quote.carrier}" passed condition "${conditionName}"`);
            }
          }
          
          return result;
        },
        { declined: false, reason: null }
      );

      console.log(`Final result for ${quote.carrier}: ${declineInfo.declined ? 'DECLINED' : 'APPROVED'}`);
      
      return {
        ...quote,
        decline: declineInfo.declined,
        declineReason: declineInfo.reason
      };
    });
    
    console.log("========== END DECLINE STATUS DEBUGGING ==========");
    
    return processedQuotes;
  };

  return (
    <>
      <QuoteBuilder
        quoteType={quoteType}
        setQuoteType={setQuoteType}
        onSubmit={handleQuoteSubmit}
        isLoading={isLoading}
        healthConditions={healthConditions}
        onConditionSelect={handleConditionSelect}
        onRemoveCondition={handleRemoveCondition}
      />
      
      {showResults && (
        <QuoteResults
          quotes={quoteResults}
          onCopyQuote={handleCopyQuote}
          onOpenEapp={handleOpenEapp}
          onOpenCarrierPreferences={() => setShowCarrierModal(true)}
        />
      )}
      
      {showHealthModal && selectedCondition && (
        <HealthConditionModal
          condition={selectedCondition}
          onClose={() => setShowHealthModal(false)}
          onSubmit={(answers) => handleConditionAnswersSubmit(selectedCondition, answers)}
        />
      )}
      
      {showCarrierModal && (
        <CarrierPreferencesModal
          quoteType={quoteType}
          onClose={() => setShowCarrierModal(false)}
          onSave={() => {
            toast({
              title: "Preferences Saved",
              description: "Your carrier preferences have been updated.",
            });
            setShowCarrierModal(false);
          }}
        />
      )}
    </>
  );
};

export default Home;
