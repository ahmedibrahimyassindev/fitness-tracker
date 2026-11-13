# Fitness Workout Tracker API

A RESTful backend API for managing fitness exercises, planning workouts,
scheduling training sessions, recording completed workouts, and tracking
fitness progress.

Built with **Node.js, Express.js, MongoDB Atlas, and Mongoose**, and
designed to deploy on **Vercel**.

This project is based on the [roadmap.sh Fitness Workout
Tracker](https://roadmap.sh/projects/fitness-workout-tracker).

## Table of Contents

-   [Project Goals](#project-goals)
-   [Features](#features)
-   [Technology Stack](#technology-stack)
-   [Architecture](#architecture)
-   [Data Models](#data-models)
-   [API Design](#api-design)
-   [Getting Started](#getting-started)
-   [Environment Variables](#environment-variables)
-   [Exercise Seeder](#exercise-seeder)
-   [Validation and Error Handling](#validation-and-error-handling)
-   [Security](#security)
-   [Testing](#testing)
-   [API Documentation](#api-documentation)
-   [Deploying to Vercel](#deploying-to-vercel)
-   [Suggested Development
    Milestones](#suggested-development-milestones)

## Project Goals

Build a maintainable backend that allows users to:

1.  Create an account and authenticate.
2.  Browse a predefined exercise library.
3.  Create workout plans containing multiple exercises.
4.  Schedule workouts for specific dates and times.
5.  Update or delete their own workout plans.
6.  Record completed workouts and add comments.
7.  Review workout history and progress reports.

The roadmap project mentions a relational database. This implementation
deliberately uses MongoDB Atlas, as requested. The data model therefore
uses MongoDB documents, references, and embedded workout exercise
details where appropriate.

## Features

### Authentication and Authorization

-   User registration and login.
-   Password hashing with bcrypt.
-   JWT-based authentication.
-   Protected routes using authentication middleware.
-   Users can access and modify only their own workout plans and workout
    sessions.
-   Logout endpoint for the client to clear its access token.

> Note: A stateless access-token logout cannot invalidate an
> already-issued JWT by itself. For a production system requiring
> immediate token revocation, add refresh-token rotation and server-side
> refresh-token storage or a token denylist.

### Exercise Library

-   List exercises.
-   Get exercise details.
-   Filter exercises by category, muscle group, or search term.
-   Seed the database with initial exercise data.
-   Exercises are shared reference data and are not owned by individual
    users.

Example categories:

-   Strength
-   Cardio
-   Flexibility

Example muscle groups:

-   Chest
-   Back
-   Shoulders
-   Arms
-   Legs
-   Core

### Workout Plans

-   Create a workout plan with multiple exercises.
-   Set repetitions, sets, and optional target weight for each exercise.
-   Schedule a workout.
-   List the authenticated user's plans.
-   Filter plans by status and date.
-   Get, update, and delete an individual plan.
-   Add notes or comments.

### Workout Sessions and Progress

Keep planned workouts separate from completed workout sessions.

-   Start or record a workout session.
-   Record actual sets, repetitions, and weights.
-   Add session notes.
-   View workout history.
-   Generate reports for a date range.
-   Summarize completed sessions, exercise volume, and training
    frequency.

This separation makes it possible to compare planned training with
actual performance.

## Technology Stack

  Area                Technology
  ------------------- ----------------------
  Runtime             Node.js (20+)
  API framework       Express.js
  Database            MongoDB Atlas
  ODM                 Mongoose
  Authentication      JSON Web Token (JWT)
  Password hashing    bcrypt
  Validation          Zod or Joi
  API documentation   Swagger / OpenAPI
  Testing             Jest and Supertest
  Code quality        ESLint and Prettier
  Deployment          Vercel

Use JavaScript with ES modules (`"type": "module"`). TypeScript can be
introduced later if desired.

## Architecture

Use a modular, layered structure:

``` text
fitness-workout-tracker/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── swagger.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── exercise.controller.js
│   │   ├── workout.controller.js
│   │   ├── session.controller.js
│   │   └── report.controller.js
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── validate.js
│   │   ├── not-found.js
│   │   └── error-handler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Exercise.js
│   │   ├── Workout.js
│   │   └── WorkoutSession.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── exercise.routes.js
│   │   ├── workout.routes.js
│   │   ├── session.routes.js
│   │   └── report.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── workout.service.js
│   │   └── report.service.js
│   ├── validators/
│   │   ├── auth.validator.js
│   │   └── workout.validator.js
│   ├── seeders/
│   │   ├── exercises.data.js
│   │   └── seed-exercises.js
│   ├── utils/
│   │   └── ApiError.js
│   ├── app.js
│   ├── index.js
│   └── server.js
├── tests/
│   ├── auth.test.js
│   ├── workouts.test.js
│   └── exercises.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Responsibilities

-   **Routes:** Define HTTP endpoints and connect middleware to
    controllers.
-   **Controllers:** Handle HTTP input and output.
-   **Services:** Contain business rules and coordinate database
    operations.
-   **Models:** Define Mongoose schemas, indexes, and document behavior.
-   **Middleware:** Handle authentication, validation, and errors.
-   **Validators:** Validate request parameters, query strings, and
    bodies.
-   **Seeders:** Populate the exercise collection with initial data.

Keep the Express application separate from the local HTTP server. Vercel
can import the exported application, while local development starts it
through `server.js`.

## Data Models

The following is the recommended initial data design. Adjust field names
and validation rules as the implementation evolves.

### User

``` js
{
  _id: ObjectId,
  name: String,
  email: String,        // unique, normalized
  password: String,     // bcrypt hash; never return this field
  createdAt: Date,
  updatedAt: Date
}
```

### Exercise

``` js
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,     // strength | cardio | flexibility
  muscleGroups: [String],
  equipment: [String],
  instructions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Workout

A workout is a reusable or scheduled plan owned by one user.

``` js
{
  _id: ObjectId,
  user: ObjectId,       // reference to User
  name: String,
  description: String,
  scheduledAt: Date,
  status: String,       // planned | completed | cancelled
  exercises: [
    {
      exercise: ObjectId, // reference to Exercise
      sets: Number,
      reps: Number,
      targetWeight: Number,
      restSeconds: Number,
      notes: String
    }
  ],
  comments: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### WorkoutSession

A session records what the user actually completed. It can optionally
reference a planned workout.

``` js
{
  _id: ObjectId,
  user: ObjectId,          // reference to User
  workout: ObjectId,       // optional reference to Workout
  startedAt: Date,
  completedAt: Date,
  status: String,          // in_progress | completed | abandoned
  exercises: [
    {
      exercise: ObjectId,
      sets: [
        {
          reps: Number,
          weight: Number
        }
      ],
      notes: String
    }
  ],
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Data modeling notes

-   Store the user reference on every private workout and session.
-   Always scope private database queries by the authenticated user's
    ID.
-   Keep exercise definitions in their own collection to avoid
    duplicating shared descriptions.
-   Embed the planned sets and reps in a workout because those values
    belong to that plan.
-   Store actual performed sets in a session so historical performance
    remains accurate even if a plan changes later.
-   Add indexes for common queries, such as
    `Workout: { user: 1, scheduledAt: 1 }` and
    `WorkoutSession: { user: 1, completedAt: -1 }`.
-   Add a unique index on the normalized user email.

## API Design

Base URL (local):

``` text
http://localhost:3000/api/v1
```

All successful responses should use a consistent JSON structure. For
example:

``` json
{
  "success": true,
  "data": {
    "id": "..."
  }
}
```

Errors should use a consistent structure:

``` json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

### Authentication

  Method   Endpoint             Auth Description
  -------- ------------------ ------ --------------------------------
  POST     `/auth/register`       No Create an account
  POST     `/auth/login`          No Authenticate and receive a JWT
  POST     `/auth/logout`        Yes Client logout / clear token

Example registration body:

``` json
{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "password": "StrongPassword123!"
}
```

Example login body:

``` json
{
  "email": "ahmed@example.com",
  "password": "StrongPassword123!"
}
```

Send the access token on protected requests:

``` http
Authorization: Bearer <access_token>
```

### Exercises

  --------------------------------------------------------------------------
  Method           Endpoint                            Auth Description
  ---------------- ------------------ --------------------- ----------------
  GET              `/exercises`                          No List exercises;
                                                            support filters
                                                            and pagination

  GET              `/exercises/:id`                      No Get exercise
                                                            details
  --------------------------------------------------------------------------

Suggested filters:

``` text
GET /exercises?category=strength
GET /exercises?muscleGroup=chest
GET /exercises?search=bench
GET /exercises?page=1&limit=20
```

### Workout Plans

  Method   Endpoint            Auth Description
  -------- ----------------- ------ ----------------------------------
  POST     `/workouts`          Yes Create a workout plan
  GET      `/workouts`          Yes List the current user's workouts
  GET      `/workouts/:id`      Yes Get one of the user's workouts
  PATCH    `/workouts/:id`      Yes Update a workout plan
  DELETE   `/workouts/:id`      Yes Delete a workout plan

Example create-workout body:

``` json
{
  "name": "Upper Body",
  "description": "Upper body strength training",
  "scheduledAt": "2026-11-15T17:00:00.000Z",
  "exercises": [
    {
      "exercise": "EXERCISE_OBJECT_ID",
      "sets": 3,
      "reps": 12,
      "targetWeight": 20,
      "restSeconds": 60
    }
  ]
}
```

Suggested filters:

``` text
GET /workouts?status=planned
GET /workouts?from=2026-11-01&to=2026-11-30
GET /workouts?page=1&limit=10
```

### Workout Sessions

  ----------------------------------------------------------------------------------
  Method           Endpoint                                    Auth Description
  ---------------- -------------------------- --------------------- ----------------
  POST             `/sessions`                                  Yes Record or start
                                                                    a workout
                                                                    session

  GET              `/sessions`                                  Yes List the user's
                                                                    workout history

  GET              `/sessions/:id`                              Yes Get a session

  PATCH            `/sessions/:id`                              Yes Update an
                                                                    in-progress
                                                                    session

  PATCH            `/sessions/:id/complete`                     Yes Mark a session
                                                                    as completed

  DELETE           `/sessions/:id`                              Yes Delete a
                                                                    session, if
                                                                    allowed by
                                                                    business rules
  ----------------------------------------------------------------------------------

Example session body:

``` json
{
  "workout": "WORKOUT_OBJECT_ID",
  "startedAt": "2026-11-15T17:05:00.000Z",
  "exercises": [
    {
      "exercise": "EXERCISE_OBJECT_ID",
      "sets": [
        { "reps": 12, "weight": 20 },
        { "reps": 10, "weight": 22.5 },
        { "reps": 8, "weight": 25 }
      ]
    }
  ],
  "notes": "Felt stronger today"
}
```

### Reports

  ------------------------------------------------------------------------------------------
  Method           Endpoint                                            Auth Description
  ---------------- ---------------------------------- --------------------- ----------------
  GET              `/reports/summary`                                   Yes Overall workout
                                                                            summary

  GET              `/reports/progress`                                  Yes Progress over a
                                                                            date range

  GET              `/reports/exercises/:exerciseId`                     Yes History for one
                                                                            exercise
  ------------------------------------------------------------------------------------------

Suggested query:

``` text
GET /reports/progress?from=2026-11-01&to=2026-11-30
```

Possible report metrics:

-   Total completed sessions.
-   Total training days.
-   Sessions grouped by week or month.
-   Total volume per exercise (`sum of reps × weight`).
-   Best recorded weight for an exercise.
-   Exercise performance over time.

Clearly define how metrics are calculated. For example, volume should be
calculated from completed session sets, not planned workout targets.

## Getting Started

### Prerequisites

-   Node.js 20 or later.
-   npm.
-   A MongoDB Atlas account and database cluster.
-   Git.
-   A Vercel account for deployment.

### 1. Clone the repository

``` bash
git clone https://github.com/YOUR_USERNAME/fitness-workout-tracker.git
cd fitness-workout-tracker
```

### 2. Install dependencies

``` bash
npm install
```

Suggested packages:

``` bash
npm install express mongoose dotenv bcryptjs jsonwebtoken zod cors helmet express-rate-limit
npm install -D nodemon jest supertest eslint prettier
```

If you choose Joi instead of Zod, install Joi and use it consistently.

### 3. Configure environment variables

Create a `.env` file in the project root using `.env.example` as a
template.

``` env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=15m
CLIENT_ORIGIN=http://localhost:5173
```

Never commit `.env` or real secrets to Git.

### 4. Configure MongoDB Atlas

1.  Create a MongoDB Atlas project and cluster.
2.  Create a database user with a strong password.
3.  Configure Network Access so your development machine and deployed
    application can reach the cluster.
4.  Copy the cluster connection string.
5.  Put it in `MONGODB_URI`.

For a quick deployment, Atlas may require allowing connections from
Vercel's changing outbound IP addresses. A broad `0.0.0.0/0` rule is
convenient for a prototype but increases exposure. Use the narrowest
network access option available for your deployment and keep database
credentials strongly restricted.

### 5. Run the application

Add scripts similar to these in `package.json`:

``` json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed:exercises": "node src/seeders/seed-exercises.js",
    "test": "jest --runInBand",
    "vercel:dev": "vercel dev"
  }
}
```

Then run:

``` bash
npm run dev
```

The API should be available at:

``` text
http://localhost:3000
```

## Environment Variables

  Variable                Required Description
  ------------------ ------------- -----------------------------------
  `NODE_ENV`                   Yes `development` or `production`
  `PORT`                     Local Local HTTP server port
  `MONGODB_URI`                Yes MongoDB Atlas connection string
  `JWT_SECRET`                 Yes Long, random JWT signing secret
  `JWT_EXPIRES_IN`             Yes Access-token lifetime, e.g. `15m`
  `CLIENT_ORIGIN`      Recommended Allowed frontend origin for CORS

Set production variables in Vercel's Project Settings → Environment
Variables. Do not rely on a local `.env` file being deployed.

## Exercise Seeder

Create a seeder that inserts a curated exercise catalog into the
`exercises` collection.

Example exercise data:

``` js
[
  {
    name: "Push Up",
    description: "A bodyweight pushing exercise.",
    category: "strength",
    muscleGroups: ["chest", "shoulders", "triceps"],
    equipment: [],
    instructions: [
      "Start in a plank position.",
      "Lower your chest toward the floor.",
      "Push back to the starting position."
    ]
  },
  {
    name: "Running",
    description: "A cardiovascular endurance exercise.",
    category: "cardio",
    muscleGroups: ["legs"],
    equipment: [],
    instructions: ["Start at a comfortable pace and maintain good form."]
  }
]
```

Seeder requirements:

-   Connect to MongoDB using the shared database configuration.
-   Insert or upsert records using a stable key such as a normalized
    exercise name.
-   Avoid creating duplicate exercises when the seeder runs more than
    once.
-   Log the number of inserted or updated records.
-   Close the database connection when the script finishes.

## Validation and Error Handling

Validate all incoming data before it reaches business logic.

Examples:

-   Validate email format and password length.
-   Reject invalid MongoDB ObjectIds.
-   Ensure sets, reps, rest time, and weights are valid non-negative or
    positive numbers as appropriate.
-   Validate dates and reject invalid date ranges.
-   Restrict workout status to supported values.
-   Reject exercise IDs that do not exist.
-   Limit pagination values to reasonable bounds.

Use centralized error middleware. Do not expose stack traces, database
details, JWT secrets, or internal errors in production responses.

Use appropriate HTTP status codes:

  Status   Meaning
  -------- ------------------------------------------
  200      Successful request
  201      Resource created
  204      Successful request with no response body
  400      Invalid request
  401      Missing or invalid authentication
  403      Authenticated but not permitted
  404      Resource not found
  409      Conflict, such as an existing email
  422      Valid JSON but invalid business data
  500      Unexpected server error

## Security

-   Hash passwords with bcrypt; never store plain-text passwords.
-   Keep JWT and database secrets in environment variables.
-   Use Helmet and configure CORS for known frontend origins.
-   Apply rate limiting to authentication endpoints.
-   Validate and sanitize user input.
-   Never trust a user ID supplied in the request body for ownership
    checks; use the authenticated user's ID.
-   Scope every private resource query by both resource ID and owner ID.
-   Do not return password hashes or sensitive internal fields.
-   Avoid logging passwords, tokens, or full connection strings.
-   Use HTTPS in production.
-   Configure MongoDB Atlas users with the minimum permissions needed.

Example ownership-aware query:

``` js
const workout = await Workout.findOne({
  _id: req.params.id,
  user: req.user.id
});

if (!workout) {
  return res.status(404).json({
    success: false,
    message: "Workout not found"
  });
}
```

Returning `404` for a resource that does not belong to the current user
avoids revealing whether another user's resource exists.

## Testing

Use Jest and Supertest to test the API.

Minimum test coverage should include:

### Authentication

-   Register with valid data.
-   Reject duplicate email addresses.
-   Reject invalid registration data.
-   Login with correct credentials.
-   Reject incorrect credentials.
-   Reject protected requests without a valid JWT.

### Exercises

-   List exercises.
-   Filter by category and muscle group.
-   Return `404` for an unknown exercise.

### Workouts

-   Create a workout as an authenticated user.
-   Reject invalid exercise IDs and invalid workout data.
-   List only the authenticated user's workouts.
-   Update and delete an owned workout.
-   Prevent one user from reading or modifying another user's workout.
-   Filter and paginate workouts correctly.

### Sessions and Reports

-   Create and complete a session.
-   Reject invalid session data.
-   Return only the user's own session history.
-   Calculate report metrics from completed sessions only.
-   Verify date-range filtering.

Use a separate test database. Never run destructive test cleanup against
production data.

## API Documentation

Document the API using OpenAPI 3.x and Swagger UI.

The documentation should include:

-   Every endpoint, HTTP method, and expected status code.
-   Request parameters and JSON body schemas.
-   Response examples.
-   JWT bearer authentication.
-   Error response examples.
-   Pagination and filtering behavior.

A suggested documentation route is:

``` text
/api-docs
```

Keep the OpenAPI specification in source control and update it whenever
an endpoint changes.

## Deploying to Vercel

Vercel supports Express applications as Vercel Functions. Keep the
Express app separate from the local server and export the app from a
recognized entry point such as `src/index.js`.

### 1. Export the Express app

`src/index.js`:

``` js
import app from "./app.js";

export default app;
```

`src/app.js`:

``` js
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { connectToDatabase } from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import exerciseRoutes from "./routes/exercise.routes.js";
import workoutRoutes from "./routes/workout.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import reportRoutes from "./routes/report.routes.js";
import { notFound } from "./middleware/not-found.js";
import { errorHandler } from "./middleware/error-handler.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(",") ?? [],
  credentials: true
}));
app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Fitness Workout Tracker API is running"
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/exercises", exerciseRoutes);
app.use("/api/v1/workouts", workoutRoutes);
app.use("/api/v1/sessions", sessionRoutes);
app.use("/api/v1/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
```

The route and middleware imports above represent the planned project
modules; create those files as you implement the API.

### 2. Cache the MongoDB connection

Serverless functions may be reused across requests. Cache the Mongoose
connection promise instead of opening a new connection for every
request.

`src/config/database.js`:

``` js
import mongoose from "mongoose";

let connectionPromise;

export async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI)
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  await connectionPromise;
  return mongoose.connection;
}
```

This module-level cache helps reuse the connection when Vercel reuses a
function instance. Do not disconnect from MongoDB after every HTTP
request.

### 3. Keep a separate local server

`src/server.js`:

``` js
import "dotenv/config";
import app from "./index.js";

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
```

For local development, use:

``` bash
npm run dev
```

For Vercel-like local development, use:

``` bash
npx vercel dev
```

### 4. Push the project to GitHub

``` bash
git add .
git commit -m "Initial fitness workout tracker API"
git push origin main
```

### 5. Import the repository into Vercel

1.  Open [Vercel](https://vercel.com/).
2.  Create a new project and import your GitHub repository.
3.  Allow Vercel to detect the Express application.
4.  Add the environment variables under Project Settings → Environment
    Variables.
5.  Add `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`, and
    `CLIENT_ORIGIN` as applicable.
6.  Deploy the project.

With a recognized Express entry point, Vercel can detect and deploy the
app without a custom build command or output directory. Start with the
default configuration rather than adding an unnecessary rewrite
configuration.

### 6. Verify the deployment

Open:

``` text
https://YOUR_PROJECT.vercel.app/api/health
```

Expected response:

``` json
{
  "success": true,
  "message": "Fitness Workout Tracker API is running"
}
```

Then test registration, login, protected workout routes, and database
operations using Postman or an API client.

### Vercel deployment considerations

-   Vercel's Express deployment runs as a serverless function; do not
    depend on a permanently running Express process.
-   Export the Express app from a recognized entry point.
-   Cache the MongoDB connection across warm invocations.
-   Use MongoDB Atlas or another database reachable from the deployed
    function; `localhost` on your development machine is not accessible
    to Vercel.
-   Configure environment variables in Vercel rather than committing
    secrets.
-   Store static assets in Vercel's `public` directory if needed; do not
    rely on `express.static()` to serve them on Vercel.
-   Keep the API stateless between requests. Do not store sessions or
    important application state in process memory.

## Suggested Development Milestones

Build the project in small, testable stages.

-   [ ] **Milestone 1 -- Project setup:** Initialize Express, configure
    environment variables, connect MongoDB Atlas, and add health check.
-   [ ] **Milestone 2 -- Data models:** Create User, Exercise, Workout,
    and WorkoutSession models and indexes.
-   [ ] **Milestone 3 -- Exercise library:** Implement exercise listing,
    filtering, details, and an idempotent seeder.
-   [ ] **Milestone 4 -- Authentication:** Implement registration,
    login, password hashing, JWT generation, and authentication
    middleware.
-   [ ] **Milestone 5 -- Workout management:** Implement create, list,
    details, update, delete, scheduling, and ownership checks.
-   [ ] **Milestone 6 -- Workout sessions:** Record actual sets, reps,
    weights, notes, and completion status.
-   [ ] **Milestone 7 -- Reports:** Implement history, date filtering,
    training frequency, and exercise-volume summaries.
-   [ ] **Milestone 8 -- Quality:** Add validation, centralized error
    handling, security middleware, and automated tests.
-   [ ] **Milestone 9 -- Documentation:** Publish Swagger/OpenAPI
    documentation and example requests.
-   [ ] **Milestone 10 -- Deployment:** Deploy to Vercel, configure
    Atlas access and environment variables, and test production
    endpoints.

## Learning Outcomes

By completing this project, you will practice:

-   Designing RESTful APIs.
-   Building authentication and authorization flows.
-   Structuring an Express application into maintainable modules.
-   Modeling related data with MongoDB and Mongoose.
-   Writing aggregation queries for reports.
-   Validating input and handling errors consistently.
-   Testing APIs with Jest and Supertest.
-   Documenting APIs with OpenAPI.
-   Deploying a Node.js backend to a serverless platform.

## References

-   [roadmap.sh -- Fitness Workout
    Tracker](https://roadmap.sh/projects/fitness-workout-tracker)
-   [Express.js Documentation](https://expressjs.com/)
-   [Mongoose Documentation](https://mongoosejs.com/docs/)
-   [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
-   [Vercel -- Deploying
    Express](https://vercel.com/kb/guide/ship-an-express-app-on-vercel)
-   [Vercel -- Express Framework
    Guide](https://vercel.com/docs/frameworks/backend/express)

------------------------------------------------------------------------

**Project:** Fitness Workout Tracker API\
**Runtime:** Node.js\
**Framework:** Express.js\
**Database:** MongoDB Atlas\
**Deployment:** Vercel
