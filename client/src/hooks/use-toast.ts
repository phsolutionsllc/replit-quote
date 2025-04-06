// Importing from shadcn/ui toast component
import { 
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport, 
} from "@/components/ui/toast";
import { useToast as useToastPrimitive } from "@/components/ui/use-toast";

export const useToast = useToastPrimitive;

export { 
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
  type ToastActionElement
} from "@/components/ui/toast";
