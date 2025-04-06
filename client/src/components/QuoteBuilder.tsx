import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuoteForm } from "@/hooks/useQuoteForm";
import { QuoteParameters, Condition } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface QuoteBuilderProps {
  quoteType: "term" | "fex";
  setQuoteType: (type: "term" | "fex") => void;
  onSubmit: (parameters: QuoteParameters) => void;
  isLoading: boolean;
  healthConditions: Condition[];
  onConditionSelect: (condition: Condition) => void;
  onRemoveCondition: (conditionId: string) => void;
}

const QuoteBuilder = ({
  quoteType,
  setQuoteType,
  onSubmit,
  isLoading,
  healthConditions,
  onConditionSelect,
  onRemoveCondition,
}: QuoteBuilderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Condition[]>([]);
  const { register, handleSubmit, watch, setValue, formState } = useQuoteForm();
  const { toast } = useToast();
  
  const { data: states = [] } = useQuery({
    queryKey: ["/api/states"],
  });
  
  const { data: conditions = [] } = useQuery({
    queryKey: ["/api/conditions"],
  });

  const termLength = watch("termLength") || "20";
  const uwClass = watch("underwritingClass") || "level";
  const formValues = watch();

  // Handle TermLength selection
  const handleTermLengthSelect = (length: string) => {
    setValue("termLength", length);
  };

  // Handle UW Class selection
  const handleUWClassSelect = (uwClass: string) => {
    setValue("underwritingClass", uwClass);
  };

  // Format currency as user types
  const formatFaceAmount = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue) {
      return parseInt(numericValue, 10).toLocaleString();
    }
    return "";
  };

  // Handle Condition Search
  const handleConditionSearch = () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a health condition to search",
      });
      return;
    }

    const results = conditions.filter((condition) =>
      condition.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(results);

    if (results.length === 0) {
      toast({
        title: "No Results",
        description: "No matching health conditions found",
      });
    } else if (results.length === 1) {
      // If only one result, select it automatically
      onConditionSelect(results[0]);
    } else {
      // Show multiple results for selection
      // This would be better with a dropdown, but we'll keep it simple
      toast({
        title: "Multiple Results",
        description: "Please click on a condition to select it",
      });
    }
  };

  const onFormSubmit = (data: QuoteParameters) => {
    // Convert the face amount from formatted string to number
    const faceAmount = parseInt(data.faceAmount.replace(/,/g, ""), 10);
    
    onSubmit({
      ...data,
      faceAmount,
    });
  };

  return (
    <Card className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8">
      <CardContent className="p-0">
        <h2 className="text-lg md:text-xl font-display font-semibold text-primary mb-6">
          Insurance Quote Builder
        </h2>
        
        {/* Quote Type Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-full">
            <div className="inline-flex rounded-full relative">
              <Button
                type="button"
                variant={quoteType === "term" ? "default" : "ghost"}
                className={`px-5 py-2 rounded-full ${
                  quoteType === "term" ? "bg-primary text-white" : "text-gray-700"
                } font-medium text-sm transition-all`}
                onClick={() => setQuoteType("term")}
              >
                Term
              </Button>
              <Button
                type="button"
                variant={quoteType === "fex" ? "default" : "ghost"}
                className={`px-5 py-2 rounded-full ${
                  quoteType === "fex" ? "bg-primary text-white" : "text-gray-700"
                } font-medium text-sm transition-all`}
                onClick={() => setQuoteType("fex")}
              >
                Final Expense
              </Button>
            </div>
          </div>
        </div>
        
        {/* Quote Form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Face Amount Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="faceAmount" className="block text-sm font-medium text-gray-700 mb-1">
                Face Amount
              </Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <Input
                  id="faceAmount"
                  className="pl-7 pr-12 py-3"
                  value={formValues.faceAmount || ""}
                  onChange={(e) => {
                    setValue("faceAmount", formatFaceAmount(e.target.value));
                  }}
                  placeholder="100,000"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </Label>
              <Input
                type="date"
                id="birthday"
                className="py-3"
                {...register("birthday")}
              />
            </div>
          </div>
          
          {/* Gender & Tobacco Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-3">Gender</span>
              <RadioGroup defaultValue="male" {...register("gender")}>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-3">Tobacco Use</span>
              <RadioGroup defaultValue="no" {...register("tobacco")}>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="tobacco-yes" />
                    <Label htmlFor="tobacco-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="tobacco-no" />
                    <Label htmlFor="tobacco-no">No</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          {/* Term Options - Only visible when Term is selected */}
          {quoteType === "term" && (
            <div className="animate-fadeIn">
              <span className="block text-sm font-medium text-gray-700 mb-3">Term Length</span>
              <div className="flex flex-wrap gap-2">
                {["10", "15", "20", "25", "30"].map((length) => (
                  <Button
                    key={length}
                    type="button"
                    variant={termLength === length ? "default" : "outline"}
                    className={`py-2 px-4 ${
                      termLength === length ? "bg-primary text-white" : "bg-white text-gray-700"
                    }`}
                    onClick={() => handleTermLengthSelect(length)}
                  >
                    {length}
                  </Button>
                ))}
                <input type="hidden" {...register("termLength")} />
              </div>
            </div>
          )}
          
          {/* FEX UW Classes - Only visible when FEX is selected */}
          {quoteType === "fex" && (
            <div className="animate-fadeIn">
              <span className="block text-sm font-medium text-gray-700 mb-3">FEX UW Classes</span>
              <div className="flex flex-wrap gap-2">
                {["level", "graded/modified", "limited pay"].map((uwClassOption) => (
                  <Button
                    key={uwClassOption}
                    type="button"
                    variant={uwClass === uwClassOption ? "default" : "outline"}
                    className={`py-2 px-4 ${
                      uwClass === uwClassOption ? "bg-primary text-white" : "bg-white text-gray-700"
                    }`}
                    onClick={() => handleUWClassSelect(uwClassOption)}
                  >
                    {uwClassOption
                      .split("/")
                      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                      .join("/")}
                  </Button>
                ))}
                <input type="hidden" {...register("underwritingClass")} />
              </div>
            </div>
          )}
          
          {/* Health Condition Search */}
          <div className="space-y-3">
            <span className="block text-sm font-medium text-gray-700">Health Condition Search</span>
            <div className="flex">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  id="conditionSearch"
                  placeholder="Search medical conditions..."
                  className="pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConditionSearch();
                    }
                  }}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button
                type="button"
                className="ml-3 px-5 py-2 bg-secondary hover:bg-secondary-dark text-white"
                onClick={handleConditionSearch}
              >
                Search
              </Button>
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 p-2 bg-white border border-gray-200 rounded shadow-sm">
                <h3 className="text-sm font-medium mb-1">Search Results:</h3>
                <ul className="space-y-1">
                  {searchResults.map((condition) => (
                    <li key={condition.id}>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-left text-sm py-1 px-2 hover:bg-gray-100"
                        onClick={() => onConditionSelect(condition)}
                      >
                        {condition.name}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Condition Tags */}
            {healthConditions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {healthConditions.map((condition) => (
                  <div
                    key={condition.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-light text-white"
                  >
                    {condition.name}
                    <button
                      type="button"
                      className="ml-1 focus:outline-none"
                      onClick={() => onRemoveCondition(condition.id)}
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Location Information */}
          <div>
            <Label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State
            </Label>
            <select
              id="state"
              className="focus:ring-primary focus:border-primary block w-full py-3 pl-3 pr-10 text-base border-gray-300 rounded-md"
              {...register("state")}
            >
              {states.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Submit Section */}
          <div className="pt-2">
            <Button
              type="submit"
              className="w-full px-6 py-3 bg-primary hover:bg-primary-dark text-white shadow-md transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Getting Quotes..." : "Get Quotes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuoteBuilder;
