import { z } from "zod";

export const holdingSchema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol too long")
    .toUpperCase(),
  name: z.string().min(1, "Name is required"),
  shares: z
    .number({ message: "Must be a valid number" })
    .positive("Must be positive")
    .max(999999999, "Too many shares"),
  avgCostBasis: z
    .number({ message: "Must be a valid number" })
    .positive("Must be positive"),
  purchaseDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export type HoldingFormData = z.infer<typeof holdingSchema>;
