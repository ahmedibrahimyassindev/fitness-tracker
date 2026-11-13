import request from "supertest";
import app from "../src/app.js";
import { setupTestDB, teardownTestDB } from "./setup.js";

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

describe("Health Check & Root Endpoints", () => {
  it("GET /api/health should return 200 and running message", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("running");
  });

  it("GET / should return 200 with documentation link", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.body.docs).toBe("/api-docs");
  });

  it("GET /api/v1/non-existent-route should return 404", async () => {
    const res = await request(app).get("/api/v1/non-existent-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
