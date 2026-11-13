import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const exerciseQuerySchema = z.object({
  query: z.object({
    category: z.enum(["strength", "cardio", "flexibility"]).optional(),
    muscleGroup: z.string().trim().optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }).optional()
});

export const exerciseIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid exercise ID format")
  })
});

