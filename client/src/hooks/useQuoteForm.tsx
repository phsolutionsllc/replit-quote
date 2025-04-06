import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const quoteFormSchema = z.object({
  faceAmount: z.string().min(1, "Face amount is required"),
  age: z.number().min(18, "Age must be at least 18").max(99, "Age must be 99 or less").or(z.string().transform(val => parseInt(val) || 0)),
  birthday: z.string().optional(), // Optional since we can calculate age from birthday
  gender: z.enum(["male", "female"]),
  tobacco: z.enum(["yes", "no"]),
  termLength: z.string().optional(), // Optional for FEX quotes
  underwritingClass: z.string().optional(), // Optional for Term quotes
  state: z.string().min(1, "State is required"),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export const useQuoteForm = () => {
  return useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: {
      faceAmount: "100,000",
      age: 35, // Default age
      gender: "male",
      tobacco: "no",
      termLength: "20",
      underwritingClass: "level",
      state: "TX",
    },
  });
};
