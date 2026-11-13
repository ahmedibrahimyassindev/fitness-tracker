import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const workoutExerciseItemSchema = z.object({
  exercise: z.string().regex(objectIdRegex, "Invalid exercise ID format"),
  sets: z.number().int().min(1, "Sets must be at least 1"),
  reps: z.number().int().min(1, "Reps must be at least 1"),
  targetWeight: z.number().min(0, "Target weight cannot be negative").default(0),
  restSeconds: z.number().int().min(0, "Rest seconds cannot be negative").default(60),
  notes: z.string().trim().optional()
});

export const createWorkoutSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Workout name is required").max(100),
    description: z.string().trim().optional(),
    scheduledAt: z.string().datetime().or(z.date()).optional(),
    status: z.enum(["planned", "completed", "cancelled"]).default("planned"),
    exercises: z.array(workoutExerciseItemSchema).min(1, "At least one exercise is required"),
    comments: z.array(z.string().trim()).optional()
  })
});

export const updateWorkoutSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid workout ID format")
  }),
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().optional(),
    scheduledAt: z.string().datetime().or(z.date()).optional(),
    status: z.enum(["planned", "completed", "cancelled"]).optional(),
    exercises: z.array(workoutExerciseItemSchema).min(1).optional(),
    comments: z.array(z.string().trim()).optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update"
  })
});

export const workoutIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid workout ID format")
  })
});

export const workoutQuerySchema = z.object({
  query: z.object({
    status: z.enum(["planned", "completed", "cancelled"]).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10)
  }).optional()
});

