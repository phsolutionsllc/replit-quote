import { useState, useCallback } from "react";
import { useToast as useShadcnToast } from "@/hooks/use-toast";

/**
 * Custom hook that provides toast functionality
 * This is a wrapper around the shadcn/ui toast implementation
 * for easy use in components
 */
export function useToast() {
  const { toast } = useShadcnToast();
  const [isVisible, setIsVisible] = useState(false);

  const showToast = useCallback(
    (message: string, options?: { title?: string; variant?: "default" | "destructive" }) => {
      setIsVisible(true);
      toast({
        title: options?.title || "Notification",
        description: message,
        variant: options?.variant || "default",
        onOpenChange: (open) => {
          setIsVisible(open);
        },
      });
    },
    [toast]
  );

  return {
    showToast,
    isVisible,
  };
}

export default useToast;
