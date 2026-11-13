import express from "express";
import cors from "cors";
import helmet from "helmet";

import { connectToDatabase } from "./config/database.js";
import { setupSwagger } from "./config/swagger.js";
import authRoutes from "./routes/auth.routes.js";
import exerciseRoutes from "./routes/exercise.routes.js";
import workoutRoutes from "./routes/workout.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import reportRoutes from "./routes/report.routes.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman) or if origin is in whitelist
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // fallback for dev
    },
    credentials: true
  })
);

app.use(express.json());

// Setup Swagger UI at /api-docs
setupSwagger(app);

// Connect DB middleware for requests (cached in database.js)
app.use(async (req, res, next) => {
  // Skip DB connection for docs, health check, and root
  if (req.path === "/" || req.path === "/api/health" || req.path.startsWith("/api-docs")) {
    return next();
  }
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// Health check endpoint with DB diagnostic
app.get("/api/health", async (req, res) => {
  const isDbConfigured = !!process.env.MONGODB_URI;
  let dbStatus = "disconnected";
  try {
    if (isDbConfigured) {
      await connectToDatabase();
      dbStatus = "connected";
    } else {
      dbStatus = "MONGODB_URI environment variable is missing";
    }
  } catch (err) {
    dbStatus = `connection error: ${err.message}`;
  }

  res.status(200).json({
    success: true,
    message: "Fitness Workout Tracker API is running",
    database: {
      configured: isDbConfigured,
      status: dbStatus
    }
  });
});

// Root endpoint redirect or info
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Fitness Workout Tracker API",
    docs: "/api-docs",
    health: "/api/health"
  });
});

// API v1 routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/exercises", exerciseRoutes);
app.use("/api/v1/workouts", workoutRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/reports", reportRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
