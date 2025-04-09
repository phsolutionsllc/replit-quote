import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const quoteFormSchema = z.object({
  faceAmount: z.string().min(1, "Face amount is required"),
  age: z.number().min(18, "Age must be at least 18").max(99, "Age must be 99 or less").or(z.string().transform(val => parseInt(val) || 0)),
  birthday: z.string().optional(), // Optional since we can calculate age from birthday
  gender: z.string(), // Changed from sex to gender to match QuoteParameters
  tobacco: z.string(), // Updated to accept any string value
  termLength: z.string().optional(), // For term quotes
  underwritingClass: z.string().optional(), // For FEX quotes
  state: z.string().min(1, "State is required"),
  selected_database: z.enum(["term", "fex"]), // Added to match app.py
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const useQuoteForm = () => {
  return useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      faceAmount: "",
      gender: "Male", // Updated from sex to gender
      tobacco: "None",
      termLength: "20",
      underwritingClass: "level",
      state: "TX",
      selected_database: "term",
    },
  });
};
