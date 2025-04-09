import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Condition } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/AppShell";
import { createPortal } from "react-dom";

interface ConditionSearchProps {
  quoteType: "term" | "fex";
  selectedConditions: Condition[];
  onConditionSelect: (condition: Condition) => void;
  onRemoveCondition: (conditionId: string) => void;
}

// Define the types for the JSON data structure
interface ConditionData {
  questions: any[];
  finalResults: any[];
  [key: string]: any;
}

interface RulesData {
  [conditionName: string]: ConditionData;
}

/**
 * ConditionSearch Component
 * 
 * This component handles searching for medical conditions with autocomplete,
 * similar to the original EligibilityChecker implementation.
 */
const ConditionSearch = ({
  quoteType,
  selectedConditions,
  onConditionSelect,
  onRemoveCondition
}: ConditionSearchProps) => {
  const [rulesData, setRulesData] = useState<RulesData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const { darkMode } = useTheme();
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Load the appropriate JSON file based on quoteType
  useEffect(() => {
    if (!quoteType) return;
    
    // Same logic as the original eligibility.js to fetch data
    const filePath = `/static/js/${quoteType}sheet.json`;

    console.log("[ConditionSearch] Loading", filePath);
    
    // Fetch the JSON file directly from static assets
    fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${filePath}: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("[ConditionSearch] Successfully loaded rules data");
        
        // Extract the conditions object based on quote type
        let conditionsData: RulesData = {};
        if (quoteType === "term") {
          if (data.Term && data.Term.Conditions) {
            conditionsData = data.Term.Conditions;
            setRulesData(conditionsData);
            
            // Log all condition names
            const conditionNames = Object.keys(conditionsData);
            console.log(`[ConditionSearch] Loaded ${conditionNames.length} term conditions`);
            
            // Check for cancer-related conditions
            const cancerConditions = conditionNames.filter(name => 
              name.toLowerCase().includes("cancer"));
            console.log("[ConditionSearch] Cancer-related conditions:", cancerConditions.join(", "));
            
            // Check specifically for past cancer
            const pastCancerConditions = conditionNames.filter(name => 
              name.toLowerCase().includes("past") && name.toLowerCase().includes("cancer"));
            console.log("[ConditionSearch] Past cancer conditions:", pastCancerConditions.join(", "));
            
            // Log sample condition structure for debugging
            if (conditionNames.length > 0) {
              const sampleCondition = conditionsData[conditionNames[0]];
              console.log("[ConditionSearch] Sample condition structure:", sampleCondition);
              
              // Check for finalResults to understand carrier result structure
              if (sampleCondition.finalResults && sampleCondition.finalResults.length > 0) {
                const sampleFinalResult = sampleCondition.finalResults[0];
                console.log("[ConditionSearch] Sample finalResult:", sampleFinalResult);
                
                // Check for underwriting array
                if (sampleFinalResult.underwriting && sampleFinalResult.underwriting.length > 0) {
                  console.log("[ConditionSearch] Sample carrier result:", sampleFinalResult.underwriting[0]);
                }
              }
            }
          } else {
            console.error("[ConditionSearch] No Term.Conditions found in data");
            setRulesData({});
          }
        } else {
          // FEX
          if (data.FEX && data.FEX.Conditions) {
            conditionsData = data.FEX.Conditions;
            setRulesData(conditionsData);
            
            // Log all condition names
            const conditionNames = Object.keys(conditionsData);
            console.log(`[ConditionSearch] Loaded ${conditionNames.length} FEX conditions`);
            
            // Check for cancer-related conditions
            const cancerConditions = conditionNames.filter(name => 
              name.toLowerCase().includes("cancer"));
            console.log("[ConditionSearch] Cancer-related conditions:", cancerConditions.join(", "));
            
            // Check specifically for past cancer
            const pastCancerConditions = conditionNames.filter(name => 
              name.toLowerCase().includes("past") && name.toLowerCase().includes("cancer"));
            console.log("[ConditionSearch] Past cancer conditions:", pastCancerConditions.join(", "));
            
            // Log sample condition structure for debugging
            if (conditionNames.length > 0) {
              const sampleCondition = conditionsData[conditionNames[0]];
              console.log("[ConditionSearch] Sample condition structure:", sampleCondition);
              
              // Check for finalResults to understand carrier result structure
              if (sampleCondition.finalResults && sampleCondition.finalResults.length > 0) {
                const sampleFinalResult = sampleCondition.finalResults[0];
                console.log("[ConditionSearch] Sample finalResult:", sampleFinalResult);
                
                // Check for underwriting array
                if (sampleFinalResult.underwriting && sampleFinalResult.underwriting.length > 0) {
                  console.log("[ConditionSearch] Sample carrier result:", sampleFinalResult.underwriting[0]);
                }
              }
            }
          } else {
            console.error("[ConditionSearch] No FEX.Conditions found in data");
            setRulesData({});
          }
        }
      })
      .catch(err => {
        console.error("[ConditionSearch] Error loading data:", err);
        setRulesData({});
      });
  }, [quoteType]);

  // Get all condition names from the rules data
  function getAllConditionNames() {
    return Object.keys(rulesData || {});
  }

  // Fetch suggestions based on query
  function fetchSuggestions(query: string) {
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    if (!rulesData) return;
    
    const allConditionNames = getAllConditionNames();
    
    // First check for exact matches
    const exactMatches = allConditionNames.filter(name =>
      name.toLowerCase() === query.toLowerCase()
    );
    
    // Then check for matches at the start of words
    const startOfWordMatches = allConditionNames.filter(name => {
      // Check if query matches start of any word in the condition name
      const words = name.toLowerCase().split(' ');
      return words.some(word => word.startsWith(query.toLowerCase()));
    });
    
    // Then check for substring matches
    const substringMatches = allConditionNames.filter(name =>
      name.toLowerCase().includes(query.toLowerCase()) && 
      !exactMatches.includes(name) && 
      !startOfWordMatches.includes(name)
    );
    
    // Combine results with priority ordering (exact -> start of word -> substring)
    const results = [
      ...exactMatches,
      ...startOfWordMatches,
      ...substringMatches
    ];
    
    // Log matching process for debugging
    console.log(`[ConditionSearch] Search for "${query}" found ${results.length} matches`);
    if (query.toLowerCase().includes("cancer")) {
      console.log(`Cancer-related conditions found: ${results.filter(name => 
        name.toLowerCase().includes("cancer")).join(", ")}`);
    }
    
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
  }

  // Handle input change
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (rulesData) {
      fetchSuggestions(query);
    }
  }

  // Handle selection of a suggestion
  function handleSuggestionClick(suggestion: string) {
    if (rulesData) {
      // Format condition object the way our app expects it
      const conditionData = rulesData[suggestion];
      
      // Log this specific condition data for debugging
      console.log(`Selected condition: ${suggestion}`);
      console.log("Condition data:", conditionData);
      
      if (conditionData.finalResults && conditionData.finalResults.length > 0) {
        console.log("This condition has finalResults:", conditionData.finalResults);
        
        // Log each finalResult's underwriting array
        conditionData.finalResults.forEach((fr: any, idx: number) => {
          if (fr.underwriting && fr.underwriting.length > 0) {
            console.log(`finalResult ${idx} has ${fr.underwriting.length} carrier results`);
            console.log("First carrier result:", fr.underwriting[0]);
          }
        });
      }
      
      const newCondition: Condition = {
        id: `${quoteType}-${suggestion.toLowerCase().replace(/\s+/g, "-")}`,
        name: suggestion,
        type: quoteType === "term" ? "term" : "fex",
        questions: conditionData.questions || [],
        finalResults: conditionData.finalResults || []
      };
      
      onConditionSelect(newCondition);
    }
    
    // Reset search
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  }
  
  // Handle submit (search button or Enter key)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim() || !rulesData) return;
    
    const matches = suggestions.filter(s => 
      s.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (matches.length === 1) {
      // If exact match, select it
      handleSuggestionClick(matches[0]);
    } else if (matches.length > 1) {
      // Show suggestions if multiple
      setShowSuggestions(true);
    } else {
      // Display inline message instead of toast for no matches
      setSuggestions([{ noResults: true, text: "No conditions found matching your search." }] as any);
      setShowSuggestions(true);
    }
  };

  // Update dropdown position whenever suggestions change
  useEffect(() => {
    if (showSuggestions && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [showSuggestions, suggestions]);

  return (
    <div className="w-full">
      <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-zinc-200' : 'text-gray-900'} transition-colors duration-300`}>Health Conditions</h3>
      
      <form onSubmit={handleSubmit} className="relative mb-4">
        <div className="relative">
          <Input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Search for medical conditions"
            className={`pr-10 ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white placeholder:text-zinc-400' : ''} transition-colors duration-300`}
          />
          <Button 
            type="submit"
            variant="ghost" 
            size="icon"
            className={`absolute right-0 top-0 h-full ${darkMode ? 'hover:bg-zinc-600' : ''}`}
          >
            <Search className={`h-4 w-4 ${darkMode ? 'text-zinc-300' : ''}`} />
          </Button>
        </div>
        
        {/* Suggestions dropdown - limited to 3 items visible */}
        {showSuggestions && (
          <div 
            className={`absolute mt-1 w-full rounded-md ${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} border shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none transition-colors duration-300`} 
            style={{ 
              maxHeight: '148px', // Approximately 3 items tall (44px per item + padding + header)
              overflowY: 'auto',
              position: 'absolute',
              zIndex: 9999
            }}
          >
            <ul className="w-full py-1 text-base">
              {suggestions.length > 0 && (
                <div className={`px-4 py-1 text-xs sticky top-0 ${darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-white text-gray-500'}`}>
                  Found {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                </div>
              )}
              {(suggestions as any).map((suggestion: any, index: number) => (
                <li 
                  key={index} 
                  className={`cursor-pointer ${darkMode ? 'hover:bg-zinc-700 text-zinc-300' : 'hover:bg-gray-100 text-gray-900'} px-4 py-2 transition-colors duration-300 block w-full text-left`}
                  onClick={() => suggestion.noResults ? null : handleSuggestionClick(suggestion)}
                >
                  {suggestion.noResults ? suggestion.text : suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
      
      {/* Selected conditions list */}
      <div className="space-y-2">
        {selectedConditions.length === 0 ? (
          <p className={`text-sm italic ${darkMode ? 'text-zinc-400' : 'text-gray-500'} transition-colors duration-300`}>
            No health conditions selected. Search above to add.
          </p>
        ) : (
          selectedConditions.map(condition => (
            <div 
              key={condition.id}
              className={`flex items-center justify-between rounded-md px-3 py-2 ${darkMode ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-50 border-gray-200'} border transition-colors duration-300`}
            >
              <span className={`${darkMode ? 'text-zinc-200' : 'text-gray-800'} transition-colors duration-300`}>
                {condition.name}
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onConditionSelect(condition)}
                  className={`${darkMode ? 'hover:bg-zinc-600 text-zinc-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'} transition-colors duration-300`}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveCondition(condition.id)}
                  className={`${darkMode ? 'hover:bg-zinc-600 text-zinc-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'} transition-colors duration-300`}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConditionSearch; 