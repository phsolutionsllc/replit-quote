import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Quote } from "@/types";
import { CopyIcon, ExternalLinkIcon, SlidersHorizontal, XCircleIcon, CheckCircleIcon } from "lucide-react";
import { useTheme } from "@/components/AppShell";

interface QuoteResultsProps {
  quotes: Quote[];
  onCopyQuote: (quote: Quote) => void;
  onOpenEapp: (quote: Quote) => void;
  onOpenCarrierPreferences: () => void;
}

const QuoteResults = ({
  quotes,
  onCopyQuote,
  onOpenEapp,
  onOpenCarrierPreferences,
}: QuoteResultsProps) => {
  const [sortBy, setSortBy] = useState<"price" | "carrier">("price");
  const { darkMode } = useTheme();

  // Log quotes to help debug UW results
  console.log("Quote results with decline info:", quotes);
  
  // NEW DEBUG: Check for price fields
  useEffect(() => {
    console.log("======= QUOTE PRICE DEBUG ========");
    quotes.forEach((quote, index) => {
      console.log(`Quote ${index} - ${quote.carrier}:`);
      console.log(`  Has monthlyPremium: ${quote.monthlyPremium !== undefined}`);
      console.log(`  monthlyPremium value: ${quote.monthlyPremium}`);
      console.log(`  Type: ${typeof quote.monthlyPremium}`);
      console.log(`  Direct property access: ${JSON.stringify(quote)}`);
      console.log("  All props:", Object.keys(quote));
      
      // Check if the quotes might have differently named price fields
      const allProps = Object.keys(quote);
      const possiblePriceFields = allProps.filter(prop => prop.toLowerCase().includes('premium') || prop.toLowerCase().includes('price') || prop.toLowerCase().includes('rate'));
      if (possiblePriceFields.length > 0) {
        console.log("  Found possible price fields:", possiblePriceFields);
        possiblePriceFields.forEach(field => {
          console.log(`  ${field}: ${(quote as any)[field]}`);
        });
      }
    });
    console.log("================================");
  }, [quotes]);
  
  // Check if any quotes are declined
  const declinedQuotes = quotes.filter(q => q.decline);
  console.log("Declined quotes:", declinedQuotes.length, declinedQuotes);

  // Filter out quotes with zero premium
  const validQuotes = quotes.filter(quote => quote.monthlyPremium > 0);
  console.log("Filtered out", quotes.length - validQuotes.length, "quotes with zero premium");

  const sortedQuotes = [...validQuotes].sort((a, b) => {
    if (sortBy === "price") {
      // Put declined quotes at the bottom when sorting by price
      if (a.decline && !b.decline) return 1;
      if (!a.decline && b.decline) return -1;
      
      // Sort approved quotes by price
      if (!a.decline && !b.decline) {
        return a.monthlyPremium - b.monthlyPremium;
      }
      
      return 0;
    } else {
      // Sort by carrier name
      return a.carrier.localeCompare(b.carrier);
    }
  });

  return (
    <div className="mt-12" id="quoteResults">
      <div className="flex items-center justify-between mb-8 relative">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} relative z-10 inline-block transition-colors duration-300`}>
          Quote Results
          <span className="absolute -z-10 inset-0 bg-gradient-to-r from-blue-100 to-purple-100 blur-lg opacity-50"></span>
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-3">
            <label className={`text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} transition-colors duration-300`}>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "price" | "carrier")}
              className={`border rounded-lg px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500 ${
                darkMode 
                  ? 'bg-zinc-700 border-zinc-600 text-white' 
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              } transition-colors duration-300`}
            >
              <option value="price">Price</option>
              <option value="carrier">Carrier</option>
            </select>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onOpenCarrierPreferences}
            className={`flex items-center gap-1 ${
              darkMode 
                ? 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white' 
                : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 hover:text-gray-900'
            } transition-colors duration-300`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden md:inline">Carrier Preferences</span>
          </Button>
        </div>
      </div>

      {/* Show info message if quotes were filtered out */}
      {quotes.length > validQuotes.length && (
        <div className={`${
          darkMode 
            ? 'bg-blue-900/20 border-blue-900/30 text-blue-300' 
            : 'bg-blue-50 border-blue-200 text-blue-800'
        } border rounded-xl p-3 mb-6 text-sm transition-colors duration-300`}>
          {quotes.length - validQuotes.length} quotes with no available rates have been filtered out.
        </div>
      )}

      {/* Message when all quotes are declined */}
      {quotes.length > 0 && quotes.every(quote => quote.decline) && (
        <div className={`${
          darkMode 
            ? 'bg-red-900/20 border-red-900/30 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        } border rounded-xl p-5 mb-6 transition-colors duration-300`}>
          <div className="flex items-start">
            <XCircleIcon className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'} mt-0.5 mr-3 transition-colors duration-300`} />
            <div>
              <h3 className="text-sm font-medium">All quotes have been declined</h3>
              <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'} mt-1 transition-colors duration-300`}>
                Based on your health information, all carriers have declined coverage. 
                You may want to remove some health conditions or speak with an advisor for alternative options.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedQuotes.map((quote, index) => (
          <Card 
            key={index} 
            className={`overflow-hidden border transition-all duration-300 hover:shadow-lg ${
              quote.decline 
                ? darkMode 
                  ? 'border-red-900/30 bg-red-900/20 hover:shadow-red-900/10' 
                  : 'border-red-200 bg-red-50 hover:shadow-red-100/30'
                : darkMode 
                  ? 'border-zinc-700 bg-zinc-800 hover:shadow-black/30 hover:border-zinc-600' 
                  : 'border-gray-200 bg-white hover:shadow-blue-100/30 hover:border-blue-200'
            }`}
          >
            <CardHeader className={`${
              quote.decline 
                ? darkMode ? 'bg-red-900/20' : 'bg-red-50/80' 
                : darkMode ? 'bg-zinc-700/80' : 'bg-gray-50/80'
            } pb-3 transition-colors duration-300`}>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className={`flex items-center ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                    {quote.carrier}
                    {quote.decline ? (
                      <XCircleIcon className={`ml-2 h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-500'} transition-colors duration-300`} />
                    ) : (
                      <CheckCircleIcon className={`ml-2 h-5 w-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'} transition-colors duration-300`} />
                    )}
                  </CardTitle>
                  <CardDescription className={`mt-1 ${darkMode ? 'text-zinc-400' : 'text-gray-600'} transition-colors duration-300`}>
                    {quote.planName}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {quote.decline ? (
                      <span className={`${darkMode ? 'text-red-400' : 'text-red-600'} font-bold transition-colors duration-300`}>Declined</span>
                    ) : (
                      <span className={`${darkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>
                        ${quote.monthlyPremium}
                        <span className={`${darkMode ? 'text-zinc-400' : 'text-gray-500'} text-sm font-normal transition-colors duration-300`}>/mo</span>
                      </span>
                    )}
                  </div>
                  {!quote.decline && (
                    <div className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-gray-500'} transition-colors duration-300`}>
                      ${quote.annualPremium}/year
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {quote.tierName && (
                <div className="text-sm mb-3">
                  <span className={`font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} transition-colors duration-300`}>
                    Type:
                  </span>{" "}
                  <span className={`${darkMode ? 'text-zinc-400' : 'text-gray-600'} transition-colors duration-300`}>
                    {quote.tierName}
                  </span>
                </div>
              )}
              
              {quote.decline && quote.declineReason && (
                <div className={`text-sm mb-3 p-3 rounded-lg ${
                  darkMode 
                    ? 'text-red-300 bg-red-900/20 border-red-900/30' 
                    : 'text-red-700 bg-red-50 border-red-200'
                } border transition-colors duration-300`}>
                  <span className="font-medium">Reason:</span> {quote.declineReason}
                </div>
              )}
              
              {quote.benefits && quote.benefits.length > 0 && (
                <div className="text-sm mb-3">
                  <span className={`font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'} transition-colors duration-300`}>
                    Benefits:
                  </span>
                  <ul className={`list-disc list-inside ${darkMode ? 'text-zinc-400' : 'text-gray-600'} mt-1 transition-colors duration-300`}>
                    {quote.benefits.map((benefit, i) => (
                      <li key={i}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onCopyQuote(quote)}
                  className={`flex items-center gap-1 ${
                    darkMode 
                      ? 'bg-zinc-700 border-zinc-600 hover:bg-zinc-600 text-zinc-300' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  } transition-colors duration-300`}
                >
                  <CopyIcon className="h-3 w-3" />
                  Copy
                </Button>
                {!quote.decline && (
                  <Button 
                    size="sm" 
                    onClick={() => onOpenEapp(quote)}
                    className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0 text-white"
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    E-App
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {quotes.length === 0 && (
        <div className={`text-center py-12 px-6 border rounded-xl ${
          darkMode 
            ? 'bg-zinc-800 border-zinc-700 text-zinc-400' 
            : 'bg-gray-50 border-gray-200 text-gray-500'
        } transition-colors duration-300`}>
          <p>No quotes found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default QuoteResults;
