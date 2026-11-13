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

beforeEach(async () => {
  await clearTestDB();
  await Exercise.insertMany(exercisesData);
});

describe("Exercises Endpoints", () => {
  describe("GET /api/v1/exercises", () => {
    it("should list all exercises with default pagination", async () => {
      const res = await request(app).get("/api/v1/exercises");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(exercisesData.length);
    });

    it("should filter exercises by category", async () => {
      const res = await request(app).get("/api/v1/exercises?category=strength");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((ex) => {
        expect(ex.category).toBe("strength");
      });
    });

    it("should filter exercises by muscleGroup", async () => {
      const res = await request(app).get("/api/v1/exercises?muscleGroup=chest");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      res.body.data.forEach((ex) => {
        expect(ex.muscleGroups).toContain("chest");
      });
    });

    it("should filter exercises by search term", async () => {
      const res = await request(app).get("/api/v1/exercises?search=Bench");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].name).toContain("Bench");
    });

    it("should support custom pagination limit and page", async () => {
      const res = await request(app).get("/api/v1/exercises?page=1&limit=2");
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
    });
  });

  describe("GET /api/v1/exercises/:id", () => {
    it("should return exercise details for a valid id", async () => {
      const existing = await Exercise.findOne({ name: "Push Up" });
      const res = await request(app).get(`/api/v1/exercises/${existing._id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(existing._id.toString());
      expect(res.body.data.name).toBe("Push Up");
    });

    it("should return 404 for non-existent valid ObjectId", async () => {
      const nonExistentId = "507f1f77bcf86cd799439011";
      const res = await request(app).get(`/api/v1/exercises/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Exercise not found");
    });

    it("should return 400 for malformed ObjectId", async () => {
      const res = await request(app).get("/api/v1/exercises/invalid-id");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

