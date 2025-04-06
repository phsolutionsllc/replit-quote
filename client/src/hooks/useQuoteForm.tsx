import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const quoteFormSchema = z.object({
  faceAmount: z.string().min(1, "Face amount is required"),
  birthday: z.string().min(1, "Date of birth is required"),
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
      gender: "male",
      tobacco: "no",
      termLength: "20",
      underwritingClass: "level",
      state: "TX",
    },
  });
};
