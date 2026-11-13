import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const sessionSetItemSchema = z.object({
  reps: z.number().int().min(0, "Reps cannot be negative"),
  weight: z.number().min(0, "Weight cannot be negative").default(0)
});

const sessionExerciseItemSchema = z.object({
  exercise: z.string().regex(objectIdRegex, "Invalid exercise ID format"),
  sets: z.array(sessionSetItemSchema).min(1, "At least one set is required per exercise"),
  notes: z.string().trim().optional()
});

export const createSessionSchema = z.object({
  body: z.object({
    workout: z.string().regex(objectIdRegex, "Invalid workout ID format").optional().nullable(),
    startedAt: z.string().datetime().or(z.date()).optional(),
    completedAt: z.string().datetime().or(z.date()).optional().nullable(),
    status: z.enum(["in_progress", "completed", "abandoned"]).default("in_progress"),
    exercises: z.array(sessionExerciseItemSchema).default([]),
    notes: z.string().trim().optional()
  })
});

export const updateSessionSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid session ID format")
  }),
  body: z.object({
    workout: z.string().regex(objectIdRegex, "Invalid workout ID format").optional().nullable(),
    startedAt: z.string().datetime().or(z.date()).optional(),
    completedAt: z.string().datetime().or(z.date()).optional().nullable(),
    status: z.enum(["in_progress", "completed", "abandoned"]).optional(),
    exercises: z.array(sessionExerciseItemSchema).optional(),
    notes: z.string().trim().optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
  })
});

export const completeSessionSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid session ID format")
  }),
  body: z.object({
    completedAt: z.string().datetime().or(z.date()).optional(),
    notes: z.string().trim().optional()
  }).optional()
});

export const sessionIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid session ID format")
  })
});

export const sessionQuerySchema = z.object({
  query: z.object({
    workout: z.string().regex(objectIdRegex).optional(),
    status: z.enum(["in_progress", "completed", "abandoned"]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10)
  }).optional()
});

