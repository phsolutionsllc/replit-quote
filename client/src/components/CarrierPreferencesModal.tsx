import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

interface CarrierPreferencesModalProps {
  quoteType: "term" | "fex";
  onClose: () => void;
  onSave: () => void;
}

interface Carrier {
  id: string;
  name: string;
  type: "term" | "fex" | "both";
}

const CarrierPreferencesModal = ({
  quoteType,
  onClose,
  onSave,
}: CarrierPreferencesModalProps) => {
  const [selectedCarriers, setSelectedCarriers] = useState<Record<string, boolean>>({});
  
  const { data: carriers = [] } = useQuery<Carrier[]>({
    queryKey: ["/api/carriers"],
  });

  const termCarriers = carriers.filter(
    (carrier) => carrier.type === "term" || carrier.type === "both"
  );
  
  const fexCarriers = carriers.filter(
    (carrier) => carrier.type === "fex" || carrier.type === "both"
  );

  useEffect(() => {
    // Initialize with all carriers selected
    const initialSelection: Record<string, boolean> = {};
    carriers.forEach((carrier) => {
      initialSelection[carrier.id] = true;
    });
    setSelectedCarriers(initialSelection);
  }, [carriers]);

  const handleToggleCarrier = (carrierId: string) => {
    setSelectedCarriers((prev) => ({
      ...prev,
      [carrierId]: !prev[carrierId],
    }));
  };

  const handleSavePreferences = () => {
    // Save carrier preferences
    localStorage.setItem("carrierPreferences", JSON.stringify(selectedCarriers));
    onSave();
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Carrier Preferences</DialogTitle>
          <DialogDescription>
            Select your preferred carriers for quoting. Unselected carriers will be hidden from results.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Term Carriers */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Term Carriers</h4>
              <ScrollArea className="h-72 pr-2">
                <div className="space-y-2">
                  {termCarriers.map((carrier) => (
                    <div key={carrier.id} className="flex items-center">
                      <Checkbox
                        id={`term-${carrier.id}`}
                        checked={selectedCarriers[carrier.id] || false}
                        onCheckedChange={() => handleToggleCarrier(carrier.id)}
                      />
                      <Label
                        htmlFor={`term-${carrier.id}`}
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        {carrier.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            {/* FEX Carriers */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">Final Expense Carriers</h4>
              <ScrollArea className="h-72 pr-2">
                <div className="space-y-2">
                  {fexCarriers.map((carrier) => (
                    <div key={carrier.id} className="flex items-center">
                      <Checkbox
                        id={`fex-${carrier.id}`}
                        checked={selectedCarriers[carrier.id] || false}
                        onCheckedChange={() => handleToggleCarrier(carrier.id)}
                      />
                      <Label
                        htmlFor={`fex-${carrier.id}`}
                        className="ml-3 text-sm font-medium text-gray-700"
                      >
                        {carrier.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSavePreferences}>
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarrierPreferencesModal;
