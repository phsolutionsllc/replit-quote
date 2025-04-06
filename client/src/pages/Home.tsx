import { useState } from "react";
import QuoteBuilder from "@/components/QuoteBuilder";
import QuoteResults from "@/components/QuoteResults";
import HealthConditionModal from "@/components/HealthConditionModal";
import CarrierPreferencesModal from "@/components/CarrierPreferencesModal";
import { QuoteParameters, Condition, Quote } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const [quoteType, setQuoteType] = useState<"term" | "fex">("term");
  const [showResults, setShowResults] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [quoteResults, setQuoteResults] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [healthConditions, setHealthConditions] = useState<Condition[]>([]);
  const { toast } = useToast();

  const handleQuoteSubmit = async (parameters: QuoteParameters) => {
    setIsLoading(true);
    try {
      // Create the request payload, making sure we send age instead of birthday
      // Use destructuring to exclude the birthday field
      const { birthday, ...payloadWithoutBirthday } = parameters;
      
      const requestPayload = {
        ...payloadWithoutBirthday,
        quoteType,
        healthConditions,
      };

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch quotes");
      }
      
      const data = await response.json();
      setQuoteResults(data);
      setShowResults(true);
      setIsLoading(false);
      
      // Scroll to results
      setTimeout(() => {
        document.getElementById("quoteResults")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch quotes. Please try again.",
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
    const updatedCondition = { ...condition, answers };
    const updatedConditions = [...healthConditions];
    const existingIndex = updatedConditions.findIndex(c => c.id === condition.id);
    
    if (existingIndex >= 0) {
      updatedConditions[existingIndex] = updatedCondition;
    } else {
      updatedConditions.push(updatedCondition);
    }
    
    setHealthConditions(updatedConditions);
    setShowHealthModal(false);
  };

  const handleRemoveCondition = (conditionId: string) => {
    setHealthConditions(prevConditions => 
      prevConditions.filter(condition => condition.id !== conditionId)
    );
  };
  
  const handleCopyQuote = (quote: Quote) => {
    const quoteText = `
      Carrier: ${quote.carrier}
      Plan: ${quote.planName}
      Type: ${quote.tierName}
      Monthly Premium: $${quote.monthlyPremium}
      Annual Premium: $${quote.annualPremium}
    `;
    
    navigator.clipboard.writeText(quoteText.trim());
    
    toast({
      title: "Quote Copied",
      description: "Quote details copied to clipboard!",
    });
  };

  const handleOpenEapp = (quote: Quote) => {
    // This would typically link to an external application URL
    window.open(`https://example.com/eapp?carrier=${quote.carrier}&plan=${quote.planName}`, "_blank");
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
