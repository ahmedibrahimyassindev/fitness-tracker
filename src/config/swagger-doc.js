export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Fitness Workout Tracker API",
    version: "1.0.0",
    description: "A RESTful backend API for managing fitness exercises, planning workouts, scheduling training sessions, recording completed workouts, and tracking fitness progress."
  },
  servers: [
    {
      url: "/api/v1",
      description: "Current Server API v1"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string", example: "body.email" },
                message: { type: "string", example: "Please provide a valid email address" }
              }
            }
          }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Ahmed" },
          email: { type: "string", example: "ahmed@example.com" },
          password: { type: "string", example: "StrongPassword123!" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "ahmed@example.com" },
          password: { type: "string", example: "StrongPassword123!" }
        }
      },
      Exercise: {
        type: "object",
        properties: {
          _id: { type: "string", example: "655f1f2e1a2b3c4d5e6f7a8b" },
          name: { type: "string", example: "Push Up" },
          description: { type: "string", example: "A bodyweight pushing exercise." },
          category: { type: "string", enum: ["strength", "cardio", "flexibility"], example: "strength" },
          muscleGroups: { type: "array", items: { type: "string" }, example: ["chest", "shoulders", "triceps"] },
          equipment: { type: "array", items: { type: "string" }, example: ["bodyweight"] },
          instructions: { type: "array", items: { type: "string" }, example: ["Start in a plank position."] },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      WorkoutExercise: {
        type: "object",
        required: ["exercise", "sets", "reps"],
        properties: {
          exercise: { type: "string", example: "655f1f2e1a2b3c4d5e6f7a8b" },
          sets: { type: "integer", example: 3 },
          reps: { type: "integer", example: 12 },
          targetWeight: { type: "number", example: 20 },
          restSeconds: { type: "integer", example: 60 },
          notes: { type: "string", example: "Focus on slow tempo" }
        }
      },
      CreateWorkoutRequest: {
        type: "object",
        required: ["name", "exercises"],
        properties: {
          name: { type: "string", example: "Upper Body" },
          description: { type: "string", example: "Upper body strength training" },
          scheduledAt: { type: "string", format: "date-time", example: "2026-11-15T17:00:00.000Z" },
          status: { type: "string", enum: ["planned", "completed", "cancelled"], example: "planned" },
          exercises: {
            type: "array",
            items: { $ref: "#/components/schemas/WorkoutExercise" }
          },
          comments: { type: "array", items: { type: "string" } }
        }
      },
      SessionSet: {
        type: "object",
        required: ["reps", "weight"],
        properties: {
          reps: { type: "integer", example: 12 },
          weight: { type: "number", example: 20 }
        }
      },
      SessionExercise: {
        type: "object",
        required: ["exercise", "sets"],
        properties: {
          exercise: { type: "string", example: "655f1f2e1a2b3c4d5e6f7a8b" },
          sets: {
            type: "array",
            items: { $ref: "#/components/schemas/SessionSet" }
          },
          notes: { type: "string", example: "Felt good" }
        }
      },
      CreateSessionRequest: {
        type: "object",
        properties: {
          workout: { type: "string", example: "655f1f2e1a2b3c4d5e6f7a8c" },
          startedAt: { type: "string", format: "date-time", example: "2026-11-15T17:05:00.000Z" },
          completedAt: { type: "string", format: "date-time", example: "2026-11-15T18:00:00.000Z" },
          status: { type: "string", enum: ["in_progress", "completed", "abandoned"], example: "completed" },
          exercises: {
            type: "array",
            items: { $ref: "#/components/schemas/SessionExercise" }
          },
          notes: { type: "string", example: "Felt stronger today" }
        }
      }
    }
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } }
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Validation error" },
          409: { description: "Email already exists" }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and get a JWT token",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } }
        },
        responses: {
          200: { description: "Logged in successfully" },
          401: { description: "Invalid credentials" }
        }
      }
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout current user session",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Logged out successfully" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/exercises": {
      get: {
        tags: ["Exercises"],
        summary: "List exercises with pagination and filtering",
        parameters: [
          { name: "category", in: "query", schema: { type: "string", enum: ["strength", "cardio", "flexibility"] } },
          { name: "muscleGroup", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } }
        ],
        responses: {
          200: { description: "List of exercises" }
        }
      }
    },
    "/exercises/{id}": {
      get: {
        tags: ["Exercises"],
        summary: "Get exercise details by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Exercise details" },
          404: { description: "Exercise not found" }
        }
      }
    },
    "/workouts": {
      post: {
        tags: ["Workouts"],
        summary: "Create a workout plan",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWorkoutRequest" } } }
        },
        responses: {
          201: { description: "Workout created" },
          400: { description: "Invalid input or exercise ID" },
          401: { description: "Unauthorized" }
        }
      },
      get: {
        tags: ["Workouts"],
        summary: "List authenticated user's workout plans",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["planned", "completed", "cancelled"] } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
        ],
        responses: {
          200: { description: "List of workouts" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/workouts/{id}": {
      get: {
        tags: ["Workouts"],
        summary: "Get a workout plan by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Workout details" },
          404: { description: "Workout not found" }
        }
      },
      patch: {
        tags: ["Workouts"],
        summary: "Update a workout plan",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object" } } }
        },
        responses: {
          200: { description: "Workout updated" },
          404: { description: "Workout not found" }
        }
      },
      delete: {
        tags: ["Workouts"],
        summary: "Delete a workout plan",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Workout deleted" },
          404: { description: "Workout not found" }
        }
      }
    },
    "/sessions": {
      post: {
        tags: ["Sessions"],
        summary: "Record or start a workout session",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateSessionRequest" } } }
        },
        responses: {
          201: { description: "Session created" },
          400: { description: "Validation error" }
        }
      },
      get: {
        tags: ["Sessions"],
        summary: "List workout session history",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "workout", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["in_progress", "completed", "abandoned"] } },
          { name: "from", in: "query", schema: { type: "string" } },
          { name: "to", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } }
        ],
        responses: {
          200: { description: "List of sessions" }
        }
      }
    },
    "/sessions/{id}": {
      get: {
        tags: ["Sessions"],
        summary: "Get session details by ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Session details" },
          404: { description: "Session not found" }
        }
      },
      patch: {
        tags: ["Sessions"],
        summary: "Update an in-progress session",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Session updated" },
          404: { description: "Session not found" }
        }
      },
      delete: {
        tags: ["Sessions"],
        summary: "Delete a session",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Session deleted" },
          404: { description: "Session not found" }
        }
      }
    },
    "/sessions/{id}/complete": {
      patch: {
        tags: ["Sessions"],
        summary: "Mark a workout session as completed",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  completedAt: { type: "string", format: "date-time" },
                  notes: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Session completed successfully" },
          404: { description: "Session not found" }
        }
      }
    },
    "/reports/summary": {
      get: {
        tags: ["Reports"],
        summary: "Get overall training summary metrics",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Summary report" }
        }
      }
    },
    "/reports/progress": {
      get: {
        tags: ["Reports"],
        summary: "Get progress report across a date range",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: {
          200: { description: "Progress report" }
        }
      }
    },
    "/reports/exercises/{exerciseId}": {
      get: {
        tags: ["Reports"],
        summary: "Get history and progress for a specific exercise",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "exerciseId", in: "path", required: true, schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: {
          200: { description: "Exercise progress history" },
          404: { description: "Exercise not found" }
        }
      }
    }
  }
};
