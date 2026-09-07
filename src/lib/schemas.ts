import { z } from "zod";

export const AnalysisRequestSchema = z.object({
  supplier: z.string().trim().min(1, "Supplier name required").max(200),
  product: z.string().trim().min(1, "Product description required").max(200),
  amount: z.number().positive("PO amount must be positive").finite(),
  country: z.string().trim().min(2).max(100).optional(),
  route: z.string().trim().max(300).optional(),
  material: z.string().trim().max(200).optional(),
  deadline: z.string().datetime().optional(),
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

export const AnalysisStatusSchema = z.enum([
  "queued",
  "validating",
  "searching",
  "extracting",
  "scoring",
  "synthesizing",
  "completed",
  "error",
]);

export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

export const DecisionSchema = z.enum(["BUY_NOW", "HOLD", "SPLIT", "SWITCH"]);
export type DecisionType = z.infer<typeof DecisionSchema>;
