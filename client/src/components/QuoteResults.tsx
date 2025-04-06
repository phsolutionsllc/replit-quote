import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterIcon, Copy, FileText } from "lucide-react";
import { Quote } from "@/types";

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
  const [sortBy, setSortBy] = useState<"monthly" | "annual">("monthly");

  // Sort quotes by premium (monthly or annual)
  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sortBy === "monthly") {
      return a.monthlyPremium - b.monthlyPremium;
    } else {
      return a.annualPremium - b.annualPremium;
    }
  });

  const getBenefitBadgeColor = (benefit: string) => {
    const benefitColors: Record<string, string> = {
      "Terminal Illness": "bg-green-100 text-green-800",
      "Critical Illness": "bg-blue-100 text-blue-800",
      "Chronic Illness": "bg-purple-100 text-purple-800",
      "Vitality Program": "bg-yellow-100 text-yellow-800",
      "Confined Care": "bg-indigo-100 text-indigo-800",
      "Family Health Benefit": "bg-pink-100 text-pink-800",
    };

    return benefitColors[benefit] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card id="quoteResults" className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <h2 className="text-lg md:text-xl font-display font-semibold text-primary">
            Quote Results
          </h2>
          
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="inline-flex items-center"
                onClick={onOpenCarrierPreferences}
              >
                <FilterIcon className="h-4 w-4 text-gray-500 mr-2" />
                Carrier Preferences
              </Button>
            </div>
            
            <div className="inline-flex rounded-md shadow-sm">
              <Button
                type="button"
                variant={sortBy === "monthly" ? "default" : "outline"}
                className="rounded-r-none"
                onClick={() => setSortBy("monthly")}
              >
                <span className="material-icons text-sm mr-2">attach_money</span>
                Monthly Premium
              </Button>
              <Button
                type="button"
                variant={sortBy === "annual" ? "default" : "outline"}
                className="rounded-l-none"
                onClick={() => setSortBy("annual")}
              >
                <span className="material-icons text-sm mr-2">date_range</span>
                Annual Premium
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quote Results Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carrier
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monthly Premium
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Annual Premium
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedQuotes.length > 0 ? (
              sortedQuotes.map((quote) => (
                <tr key={`${quote.carrier}-${quote.planName}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-24">
                        <img
                          className="h-12 w-auto object-contain"
                          src={`https://via.placeholder.com/175x50?text=${encodeURIComponent(quote.carrier)}`}
                          alt={`${quote.carrier} logo`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{quote.planName}</div>
                    <div className="text-sm text-gray-500">{quote.tierName}</div>
                    {quote.benefits && quote.benefits.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {quote.benefits.map((benefit, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBenefitBadgeColor(
                              benefit
                            )}`}
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${quote.monthlyPremium.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${quote.annualPremium.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      type="button"
                      className="inline-flex items-center px-3 py-2 bg-primary hover:bg-primary-dark text-white"
                      onClick={() => onCopyQuote(quote)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      type="button"
                      className="ml-2 inline-flex items-center px-3 py-2 bg-secondary hover:bg-secondary-dark text-white"
                      onClick={() => onOpenEapp(quote)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      eApp
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No quotes available. Please adjust your search criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default QuoteResults;
