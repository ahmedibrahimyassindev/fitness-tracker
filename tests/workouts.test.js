import request from "supertest";
import app from "../src/app.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";
import { Exercise } from "../src/models/Exercise.js";
import { exercisesData } from "../src/seeders/exercises.data.js";

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe("Workouts Endpoints", () => {
  let tokenUser1;
  let tokenUser2;
  let exerciseId1;
  let exerciseId2;

  beforeEach(async () => {
    await clearTestDB();
    const createdExercises = await Exercise.insertMany(exercisesData.slice(0, 3));
    exerciseId1 = createdExercises[0]._id.toString();
    exerciseId2 = createdExercises[1]._id.toString();

    // Register user 1
    const resUser1 = await request(app).post("/api/v1/auth/register").send({
      name: "User One",
      email: "user1@example.com",
      password: "Password123!"
    });
    tokenUser1 = resUser1.body.data.token;

    // Register user 2
    const resUser2 = await request(app).post("/api/v1/auth/register").send({
      name: "User Two",
      email: "user2@example.com",
      password: "Password123!"
    });
    tokenUser2 = resUser2.body.data.token;
  });

  describe("POST /api/v1/workouts", () => {
    it("should create a workout plan for authenticated user", async () => {
      const workoutPayload = {
        name: "Push Day",
        description: "Chest and triceps routine",
        scheduledAt: new Date().toISOString(),
        exercises: [
          {
            exercise: exerciseId1,
            sets: 4,
            reps: 10,
            targetWeight: 50,
            restSeconds: 90,
            notes: "Keep back straight"
          }
        ]
      };

      const res = await request(app)
        .post("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send(workoutPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe("Push Day");
      expect(res.body.data.exercises.length).toBe(1);
      expect(res.body.data.exercises[0].exercise._id).toBe(exerciseId1);
    });

    it("should reject workout with non-existent exercise ID", async () => {
      const nonExistentExerciseId = "507f1f77bcf86cd799439011";
      const res = await request(app)
        .post("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          name: "Invalid Workout",
          exercises: [
            {
              exercise: nonExistentExerciseId,
              sets: 3,
              reps: 10
            }
          ]
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("do not exist");
    });

    it("should reject unauthenticated request", async () => {
      const res = await request(app).post("/api/v1/workouts").send({
        name: "No Auth",
        exercises: []
      });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/workouts", () => {
    it("should list only the authenticated user's workouts", async () => {
      // User 1 creates a workout
      await request(app)
        .post("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          name: "User1 Plan",
          exercises: [{ exercise: exerciseId1, sets: 3, reps: 8 }]
        });

      // User 2 creates a workout
      await request(app)
        .post("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser2}`)
        .send({
          name: "User2 Plan",
          exercises: [{ exercise: exerciseId2, sets: 3, reps: 12 }]
        });

      // User 1 lists workouts
      const res1 = await request(app)
        .get("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser1}`);

      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(1);
      expect(res1.body.data[0].name).toBe("User1 Plan");

      // User 2 lists workouts
      const res2 = await request(app)
        .get("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser2}`);

      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(1);
      expect(res2.body.data[0].name).toBe("User2 Plan");
    });
  });

  describe("GET /api/v1/workouts/:id", () => {
    it("should get workout details for the owner", async () => {
      const createRes = await request(app)
        .post("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          name: "Plan A",
          exercises: [{ exercise: exerciseId1, sets: 3, reps: 10 }]
        });

      const workoutId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/v1/workouts/${workoutId}`)
        .set("Authorization", `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Plan A");
    });

    it("should return 404 when another user tries to access the workout", async () => {
      const createRes = await request(app)
        .post("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          name: "Secret User1 Plan",
          exercises: [{ exercise: exerciseId1, sets: 3, reps: 10 }]
        });

      const workoutId = createRes.body.data._id;

      const res = await request(app)
        .get(`/api/v1/workouts/${workoutId}`)
        .set("Authorization", `Bearer ${tokenUser2}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Workout not found");
    });
  });

  describe("PATCH /api/v1/workouts/:id", () => {
    it("should update an owned workout plan", async () => {
      const createRes = await request(app)
        .post("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          name: "Initial Name",
          exercises: [{ exercise: exerciseId1, sets: 3, reps: 10 }]
        });

      const workoutId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/workouts/${workoutId}`)
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          name: "Updated Name",
          status: "completed"
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe("Updated Name");
      expect(res.body.data.status).toBe("completed");
    });

    it("should prevent modifying another user's workout", async () => {
      const createRes = await request(app)
        .post("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          name: "User1 Plan",
          exercises: [{ exercise: exerciseId1, sets: 3, reps: 10 }]
        });

      const workoutId = createRes.body.data._id;

      const res = await request(app)
        .patch(`/api/v1/workouts/${workoutId}`)
        .set("Authorization", `Bearer ${tokenUser2}`)
        .send({ name: "Hacked Name" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/workouts/:id", () => {
    it("should delete owned workout plan", async () => {
      const createRes = await request(app)
        .post("/api/v1/workouts")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          name: "To Delete",
          exercises: [{ exercise: exerciseId1, sets: 3, reps: 10 }]
        });

      const workoutId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/api/v1/workouts/${workoutId}`)
        .set("Authorization", `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);

      // Verify it's gone
      const verifyRes = await request(app)
        .get(`/api/v1/workouts/${workoutId}`)
        .set("Authorization", `Bearer ${tokenUser1}`);

      expect(verifyRes.status).toBe(404);
    });
  });
});
