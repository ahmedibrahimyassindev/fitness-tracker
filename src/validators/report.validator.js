import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const reportProgressQuerySchema = z.object({
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional()
  }).optional()
});

export const exerciseReportSchema = z.object({
  params: z.object({
    exerciseId: z.string().regex(objectIdRegex, "Invalid exercise ID format")
  }),
  query: z.object({
    from: z.string().optional(),
    to: z.string().optional()
  }).optional()
});

