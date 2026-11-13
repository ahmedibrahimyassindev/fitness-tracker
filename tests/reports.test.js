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

describe("Reports Endpoints", () => {
  let token;
  let exerciseId;

  beforeEach(async () => {
    await clearTestDB();
    const created = await Exercise.insertMany(exercisesData.slice(0, 1));
    exerciseId = created[0]._id.toString();

    const u = await request(app).post("/api/v1/auth/register").send({
      name: "Athlete",
      email: "athlete@example.com",
      password: "Password123!"
    });
    token = u.body.data.token;

    // Create and complete session 1
    const s1 = await request(app)
      .post("/api/v1/sessions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        exercises: [
          {
            exercise: exerciseId,
            sets: [
              { reps: 10, weight: 50 }, // 500
              { reps: 10, weight: 60 }  // 600
            ]
          }
        ]
      });

    await request(app)
      .patch(`/api/v1/sessions/${s1.body.data._id}/complete`)
      .set("Authorization", `Bearer ${token}`)
      .send();

    // Create session 2 (still in_progress, should not count towards completed volume)
    await request(app)
      .post("/api/v1/sessions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        exercises: [
          {
            exercise: exerciseId,
            sets: [{ reps: 10, weight: 100 }]
          }
        ]
      });
  });

  describe("GET /api/v1/reports/summary", () => {
    it("should return summary metrics for completed sessions", async () => {
      const res = await request(app)
        .get("/api/v1/reports/summary")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalSessions).toBe(2);
      expect(res.body.data.completedSessions).toBe(1);
      expect(res.body.data.totalVolume).toBe(1100); // 10*50 + 10*60
      expect(res.body.data.totalTrainingDays).toBe(1);
    });
  });

  describe("GET /api/v1/reports/progress", () => {
    it("should return progress report with exercise breakdown", async () => {
      const res = await request(app)
        .get("/api/v1/reports/progress")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalCompletedSessions).toBe(1);
      expect(res.body.data.totalVolume).toBe(1100);
      expect(res.body.data.exerciseBreakdown.length).toBe(1);
      expect(res.body.data.exerciseBreakdown[0].maxWeight).toBe(60);
      expect(res.body.data.exerciseBreakdown[0].totalVolume).toBe(1100);
    });
  });

  describe("GET /api/v1/reports/exercises/:exerciseId", () => {
    it("should return exercise specific history and stats", async () => {
      const res = await request(app)
        .get(`/api/v1/reports/exercises/${exerciseId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.exercise.id).toBe(exerciseId);
      expect(res.body.data.stats.maxWeightLifted).toBe(60);
      expect(res.body.data.stats.totalVolumeLifted).toBe(1100);
      expect(res.body.data.stats.totalRepsCompleted).toBe(20);
      expect(res.body.data.history.length).toBe(1);
    });
  });
});

