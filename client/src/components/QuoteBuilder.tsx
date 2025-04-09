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
import ConditionSearch from "@/components/ConditionSearch";
import { useTheme } from "@/components/AppShell";

// Add State interface
interface State {
  code: string;
  name: string;
}

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
  const [manualAgeEntry, setManualAgeEntry] = useState<boolean>(false);
  const { register, handleSubmit: formHandleSubmit, watch, setValue, formState } = useQuoteForm();
  const { toast } = useToast();
  const { darkMode } = useTheme();
  
  const { data: states = [] } = useQuery({
    queryKey: ["/api/states"],
  });
  
  // Calculate age from birthday
  useEffect(() => {
    const birthday = watch("birthday");
    if (birthday && !manualAgeEntry) {
      const birthDate = new Date(birthday);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      
      // Make sure it's a valid age
      if (calculatedAge >= 18 && calculatedAge <= 99) {
        setValue("age", calculatedAge);
      }
    }
  }, [watch("birthday"), manualAgeEntry, setValue]);

  // useEffect for defaults
  useEffect(() => {
    // Set initial values for gender and tobacco to ensure they're properly set
    setValue("gender", "Male");
    setValue("tobacco", "None");
  }, [setValue]);

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

  // Format currency as user types and round to nearest $1,000
  const formatFaceAmount = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    
    const amount = parseInt(numericValue, 10);
    if (isNaN(amount)) return "";
    
    // Return formatted amount without rounding for display during typing
    return amount.toLocaleString();
  };

  // Rounds the face amount to the nearest $1,000 and enforces min/max limits
  const roundFaceAmount = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    
    let amount = parseInt(numericValue, 10);
    if (isNaN(amount)) return "";
    
    // Round to nearest $1,000
    amount = Math.round(amount / 1000) * 1000;
    
    // Apply min/max limits based on quote type
    if (quoteType === 'term') {
      if (amount < 25000) amount = 25000;
      if (amount > 500000) amount = 500000;
    } else { // FEX
      if (amount < 2000) amount = 2000;
      if (amount > 50000) amount = 50000;
    }
    
    return amount.toLocaleString();
  };

  // Handle age input - when user types age directly, disable birthday-to-age calculation
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    // Use a type assertion to safely handle empty values
    const ageValue = value ? parseInt(value) : null;
    setValue("age", ageValue as any); // Type assertion to handle null
    setManualAgeEntry(Boolean(value));
  };

  const onFormSubmit = async (data: any) => {
    console.log('[DEBUG] Form submit triggered');
    console.log('[DEBUG] Raw form data:', data);
    
    // Check if age is provided
    if (!data.age) {
      toast({
        title: "Age Required",
        description: "Please enter an age or date of birth",
        variant: "destructive",
      });
      return;
    }
    
    // Convert the face amount from formatted string to number
    // Remove commas, convert to a number, and round to nearest $1,000
    let faceAmount = parseInt(String(data.faceAmount || '0').replace(/,/g, ""), 10);
    if (isNaN(faceAmount) || faceAmount <= 0) {
      toast({
        title: "Face Amount Required",
        description: "Please enter a valid face amount",
        variant: "destructive",
      });
      return;
    }
    
    console.log('[DEBUG] Age and face amount validated'); // Added debug log
    
    // Round to nearest $1,000
    faceAmount = Math.round(faceAmount / 1000) * 1000;
    
    // Apply min/max limits based on quote type
    if (quoteType === 'term') {
      if (faceAmount < 25000) {
        toast({
          title: "Face Amount Below Minimum",
          description: "Term insurance requires a minimum of $25,000 coverage",
          variant: "destructive",
        });
        return;
      }
      if (faceAmount > 500000) {
        toast({
          title: "Face Amount Above Maximum",
          description: "Term insurance maximum is $500,000 coverage",
          variant: "destructive",
        });
        return;
      }
    } else { // FEX
      if (faceAmount < 2000) {
        toast({
          title: "Face Amount Below Minimum",
          description: "Final Expense insurance requires a minimum of $2,000 coverage",
          variant: "destructive",
        });
        return;
      }
      if (faceAmount > 50000) {
        toast({
          title: "Face Amount Above Maximum",
          description: "Final Expense insurance maximum is $50,000 coverage",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Ensure gender is properly set - use the value from the form
    // This should get the actual selected gender from the radio buttons
    const gender = data.gender === 'Male' || data.gender === 'Female' ? data.gender : 'Male';
    console.log('[DEBUG] Using gender from form:', gender);
    
    // Use exact tobacco values from form that match the database
    const tobacco = data.tobacco === 'Cigarettes' ? 'Cigarettes' : 'None';
    console.log('[DEBUG] Using tobacco from form:', tobacco);
    
    // Prepare the data based on quote type
    const submitData = {
      ...data,
      gender, // Explicitly set gender from form
      tobacco, // Properly capitalized tobacco value
      faceAmount: String(faceAmount), // Make sure this is sent as a string with proper formatting
      state: data.state || 'Texas', // Default state
      selected_database: quoteType,
      age: Number(data.age), // Ensure age is a number
      ...(quoteType === 'term' ? { term_length: data.termLength } : {}),
      ...(quoteType === 'fex' ? { underwriting_class: data.underwritingClass } : {})
    };

    // Log what we're sending
    console.log('[DEBUG] Form data:', data);
    console.log('[DEBUG] Processed form data for submission:', submitData);
    console.log('[DEBUG] About to call onSubmit function'); // Added debug log

    try {
      await onSubmit(submitData);
      console.log('[DEBUG] onSubmit completed successfully');
    } catch (error) {
      console.error('[DEBUG] Error in onSubmit:', error);
    }
  };

  return (
    <Card className={`${darkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} rounded-xl shadow-md p-4 md:p-6 mb-8 overflow-hidden relative transition-colors duration-300`}>
      {/* Subtle glow effect */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl"></div>
      
      <CardContent className="p-0 relative z-10">
        {/* Quote Type Selector */}
        <div className="flex justify-center mb-8">
          <div className={`${darkMode ? 'bg-zinc-700' : 'bg-gray-100'} p-1 rounded-full transition-colors duration-300`}>
            <div className="inline-flex rounded-full relative">
              <Button
                type="button"
                variant="ghost"
                className={`px-5 py-2 rounded-full ${
                  quoteType === "term" 
                    ? "bg-black text-white shadow-md border border-transparent ring-1 ring-black/5 hover:shadow-black/10" 
                    : `${darkMode ? 'text-zinc-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`
                } font-medium text-sm transition-all`}
                onClick={() => {
                  setQuoteType("term");
                  // Clear face amount when changing quote type to enforce limits
                  if (quoteType !== "term") {
                    setValue("faceAmount", "");
                  }
                }}
              >
                Term
              </Button>
              <Button
                type="button"
                variant="ghost"
                className={`px-5 py-2 rounded-full ${
                  quoteType === "fex" 
                    ? "bg-black text-white shadow-md border border-transparent ring-1 ring-black/5 hover:shadow-black/10" 
                    : `${darkMode ? 'text-zinc-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`
                } font-medium text-sm transition-all`}
                onClick={() => {
                  setQuoteType("fex");
                  // Clear face amount when changing quote type to enforce limits
                  if (quoteType !== "fex") {
                    setValue("faceAmount", "");
                  }
                }}
              >
                Final Expense
              </Button>
            </div>
          </div>
        </div>
        
        <form onSubmit={formHandleSubmit(onFormSubmit)} className="space-y-8">
          {/* Face Amount Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label htmlFor="faceAmount" className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} mb-2 transition-colors duration-300`}>
                Face Amount {quoteType === "term" ? "(Min: $25,000, Max: $500,000)" : "(Min: $2,000, Max: $50,000)"}
              </Label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-zinc-400' : 'text-gray-500'} transition-colors duration-300`}>
                  <span className="sm:text-sm">$</span>
                </div>
                <Input
                  id="faceAmount"
                  className={`pl-7 pr-12 py-3 ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500'} rounded-lg transition-all`}
                  value={formValues.faceAmount || ""}
                  onChange={(e) => {
                    setValue("faceAmount", formatFaceAmount(e.target.value));
                  }}
                  onBlur={(e) => {
                    setValue("faceAmount", roundFaceAmount(e.target.value));
                  }}
                  placeholder={quoteType === "term" ? "100,000" : "10,000"}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age" className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} mb-2 transition-colors duration-300`}>
                  Age
                </Label>
                <Input
                  type="number"
                  id="age"
                  className={`py-3 ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500'} rounded-lg transition-all`}
                  min="18"
                  max="99"
                  value={formValues.age || ""}
                  onChange={handleAgeChange}
                  placeholder="Enter age"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="birthday" className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} mb-2 transition-colors duration-300`}>
                  Or Date of Birth
                </Label>
                <Input
                  type="date"
                  id="birthday"
                  className={`py-3 ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:ring-blue-500 focus:border-blue-500'} rounded-lg transition-all ${manualAgeEntry ? 'opacity-50 cursor-not-allowed' : ''}`}
                  {...register("birthday")}
                  onChange={(e) => {
                    if (!manualAgeEntry) {
                      register("birthday").onChange(e);
                    }
                  }}
                  disabled={manualAgeEntry}
                />
              </div>
            </div>
          </div>
          
          {/* Gender & Tobacco Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <Label htmlFor="gender" className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} mb-2 transition-colors duration-300`}>
                Gender
              </Label>
              <div className="flex space-x-8">
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="gender-male" 
                    {...register("gender")}
                    value="Male" 
                    defaultChecked={formValues.gender === "Male"}
                    className="text-black border-gray-300"
                  />
                  <Label htmlFor="gender-male" className={`${darkMode ? 'text-zinc-300' : 'text-gray-700'} transition-colors duration-300`}>Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="gender-female" 
                    {...register("gender")}
                    value="Female"
                    defaultChecked={formValues.gender === "Female"}
                    className="text-black border-gray-300"
                  />
                  <Label htmlFor="gender-female" className={`${darkMode ? 'text-zinc-300' : 'text-gray-700'} transition-colors duration-300`}>Female</Label>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="tobacco" className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} mb-2 transition-colors duration-300`}>
                Tobacco Use
              </Label>
              <div className="flex space-x-8">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="tobacco-none"
                    {...register("tobacco")}
                    value="None"
                    defaultChecked={formValues.tobacco === "None"}
                    className="text-black border-gray-300"
                  />
                  <Label htmlFor="tobacco-none" className={`${darkMode ? 'text-zinc-300' : 'text-gray-700'} transition-colors duration-300`}>None</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="tobacco-cigarettes"
                    {...register("tobacco")}
                    value="Cigarettes"
                    defaultChecked={formValues.tobacco === "Cigarettes"}
                    className="text-black border-gray-300"
                  />
                  <Label htmlFor="tobacco-cigarettes" className={`${darkMode ? 'text-zinc-300' : 'text-gray-700'} transition-colors duration-300`}>Cigarettes</Label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Term Options / FEX UW Class */}
          {quoteType === "term" ? (
            <div>
              <Label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} mb-2 transition-colors duration-300`}>Term Length</Label>
              <div className="flex flex-wrap gap-2">
                {["10", "15", "20", "25", "30"].map((length) => (
                  <Button
                    key={length}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTermLengthSelect(length)}
                    className={termLength === length 
                      ? "bg-black text-white border-0 shadow-md ring-1 ring-black/5 hover:shadow-black/10" 
                      : `${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600 hover:text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:text-gray-900'} transition-colors duration-300`}
                  >
                    {length}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} mb-2 transition-colors duration-300`}>Underwriting Class</Label>
              <div className="flex flex-wrap gap-2">
                {["level", "graded/modified", "limited pay", "guaranteed"].map((uwClassOption) => (
                  <Button
                    key={uwClassOption}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUWClassSelect(uwClassOption)}
                    className={uwClass === uwClassOption 
                      ? "bg-black text-white border-0 shadow-md ring-1 ring-black/5 hover:shadow-black/10" 
                      : `${darkMode ? 'bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-zinc-600 hover:text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:text-gray-900'} transition-colors duration-300`}
                  >
                    {uwClassOption.charAt(0).toUpperCase() + uwClassOption.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {/* State Selector */}
          <div>
            <Label htmlFor="state" className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} mb-2 transition-colors duration-300`}>
              State
            </Label>
            <select
              {...register("state")}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${darkMode ? 'bg-zinc-700 border-zinc-600 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'} transition-colors duration-300`}
              defaultValue="Texas"
            >
              {(states as State[]).map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Health Conditions */}
          <div className={`border-t ${darkMode ? 'border-zinc-700' : 'border-gray-200'} pt-6 transition-colors duration-300`}>
            <ConditionSearch
              quoteType={quoteType}
              selectedConditions={healthConditions}
              onConditionSelect={onConditionSelect}
              onRemoveCondition={onRemoveCondition}
            />
          </div>
          
          <div className="py-6">
            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
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