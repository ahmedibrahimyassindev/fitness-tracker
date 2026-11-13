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

describe("Sessions Endpoints", () => {
  let tokenUser1;
  let tokenUser2;
  let exerciseId;

  beforeEach(async () => {
    await clearTestDB();
    const created = await Exercise.insertMany(exercisesData.slice(0, 2));
    exerciseId = created[0]._id.toString();

    const u1 = await request(app).post("/api/v1/auth/register").send({
      name: "Runner 1",
      email: "runner1@example.com",
      password: "Password123!"
    });
    tokenUser1 = u1.body.data.token;

    const u2 = await request(app).post("/api/v1/auth/register").send({
      name: "Runner 2",
      email: "runner2@example.com",
      password: "Password123!"
    });
    tokenUser2 = u2.body.data.token;
  });

  describe("POST /api/v1/sessions", () => {
    it("should start a new workout session", async () => {
      const res = await request(app)
        .post("/api/v1/sessions")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          notes: "Morning push workout",
          exercises: [
            {
              exercise: exerciseId,
              sets: [
                { reps: 10, weight: 20 },
                { reps: 10, weight: 22.5 }
              ]
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("in_progress");
      expect(res.body.data.exercises.length).toBe(1);
    });
  });

  describe("PATCH /api/v1/sessions/:id/complete", () => {
    it("should mark a session as completed", async () => {
      const startRes = await request(app)
        .post("/api/v1/sessions")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          exercises: [{ exercise: exerciseId, sets: [{ reps: 8, weight: 30 }] }]
        });

      const sessionId = startRes.body.data._id;

      const completeRes = await request(app)
        .patch(`/api/v1/sessions/${sessionId}/complete`)
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({ notes: "Crushed it" });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.success).toBe(true);
      expect(completeRes.body.data.status).toBe("completed");
      expect(completeRes.body.data.completedAt).toBeDefined();
    });

    it("should not allow another user to complete my session", async () => {
      const startRes = await request(app)
        .post("/api/v1/sessions")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({
          exercises: [{ exercise: exerciseId, sets: [{ reps: 8, weight: 30 }] }]
        });

      const sessionId = startRes.body.data._id;

      const completeRes = await request(app)
        .patch(`/api/v1/sessions/${sessionId}/complete`)
        .set("Authorization", `Bearer ${tokenUser2}`)
        .send({ notes: "Trying to hack" });

      expect(completeRes.status).toBe(404);
    });
  });

  describe("GET /api/v1/sessions", () => {
    it("should list sessions for authenticated user only", async () => {
      await request(app)
        .post("/api/v1/sessions")
        .set("Authorization", `Bearer ${tokenUser1}`)
        .send({ notes: "Session 1 User 1" });

      await request(app)
        .post("/api/v1/sessions")
        .set("Authorization", `Bearer ${tokenUser2}`)
        .send({ notes: "Session 1 User 2" });

      const res = await request(app)
        .get("/api/v1/sessions")
        .set("Authorization", `Bearer ${tokenUser1}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].notes).toBe("Session 1 User 1");
    });
  });
});
