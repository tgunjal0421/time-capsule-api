const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../server");
const Capsule = require("../models/Capsule");
const User = require("../models/User");

let token;
let capsuleId;
let unlockCode;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});
  await Capsule.deleteMany({});

  const email = `test+${Date.now()}@mail.com`;
  const password = "test1234";

  // Register and login a test user
  await request(app).post("/auth/register").send({ email, password });
  const res = await request(app).post("/auth/login").send({ email, password });
  token = res.body.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Capsule Creation", () => {
  it("should create a new capsule", async () => {
    const res = await request(app)
      .post("/capsules")
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "Test message",
        unlock_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour in future
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.unlock_code).toBeDefined();

    capsuleId = res.body.id;
    unlockCode = res.body.unlock_code;
  });
});

describe("Capsule Retrieval with Unlock Logic", () => {
  it("should return 403 if unlock time has not passed", async () => {
    const res = await request(app)
      .get(`/capsules/${capsuleId}?code=${unlockCode}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Capsule is still locked");
  });

  it("should return 401 for invalid unlock code", async () => {
    const res = await request(app)
      .get(`/capsules/${capsuleId}?code=wrongcode`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid unlock code");
  });
});

describe("Capsule Pagination", () => {
  beforeAll(async () => {
    const future = new Date(Date.now() + 3600000).toISOString();

    for (let i = 0; i < 12; i++) {
      await request(app)
        .post("/capsules")
        .set("Authorization", `Bearer ${token}`)
        .send({
          message: `Message ${i}`,
          unlock_at: future
        });
    }
  });

  it("should return first page of capsules", async () => {
    const res = await request(app)
      .get("/capsules?page=1&limit=5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.capsules.length).toBeLessThanOrEqual(5);
    expect(res.body.page).toBe(1);
  });

  it("should return second page of capsules", async () => {
    const res = await request(app)
      .get("/capsules?page=2&limit=5")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.capsules.length).toBeLessThanOrEqual(5);
    expect(res.body.page).toBe(2);
  });
});

describe("Capsule Update", () => {
  it("should update the capsule before unlock time", async () => {
    const res = await request(app)
      .put(`/capsules/${capsuleId}?code=${unlockCode}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "Updated message",
        unlock_at: new Date(Date.now() + 7200000).toISOString() // +2 hours
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Capsule updated successfully");
  });

  it("should return 401 with wrong unlock code", async () => {
    const res = await request(app)
      .put(`/capsules/${capsuleId}?code=wrongcode`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "This should not update"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid unlock code");
  });
});

describe("Capsule Delete", () => {
  let deleteCapsuleId, deleteCode;

  beforeAll(async () => {
    const res = await request(app)
      .post("/capsules")
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "To be deleted",
        unlock_at: new Date(Date.now() + 3600000).toISOString()
      });

    deleteCapsuleId = res.body.id;
    deleteCode = res.body.unlock_code;
  });

  it("should delete the capsule before unlock time", async () => {
    const res = await request(app)
      .delete(`/capsules/${deleteCapsuleId}?code=${deleteCode}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Capsule deleted successfully");
  });

  it("should return 404 when trying to delete again", async () => {
    const res = await request(app)
      .delete(`/capsules/${deleteCapsuleId}?code=${deleteCode}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
  });
});

describe("Expired Capsule Retrieval", () => {
  let expiredCapsuleId, expiredCode;

  beforeAll(async () => {
    const res = await request(app)
      .post("/capsules")
      .set("Authorization", `Bearer ${token}`)
      .send({
        message: "Expired content",
        unlock_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() // 40 days ago
      });

    expiredCapsuleId = res.body.id;
    expiredCode = res.body.unlock_code;

    // Mark it as expired directly in DB
    await Capsule.findByIdAndUpdate(expiredCapsuleId, { is_expired: true });
  });

  it("should return 410 for expired capsule", async () => {
    const res = await request(app)
      .get(`/capsules/${expiredCapsuleId}?code=${expiredCode}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(410);
    expect(res.body.message).toBe("Capsule expired");
  });
});
