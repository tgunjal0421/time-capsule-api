const request = require("supertest");
const app = require("../../server.js");
const mongoose = require("mongoose");
const User = require("../models/User");

// Ensure proper cleanup and isolation between tests
beforeEach(async () => {
  await User.deleteMany({});
});

// Connect to the database before all tests
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

// Close the database connection after all tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe("Auth Tests", () => {
  const testEmail = `testuser+${Date.now()}@example.com`;
  const testPassword = "test1234";

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("User created");
  });

  it("should login and return a token", async () => {
    // Ensure user exists first
    await request(app).post("/auth/register").send({
      email: testEmail,
      password: testPassword
    });

    const res = await request(app)
      .post("/auth/login")
      .send({
        email: testEmail,
        password: testPassword
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
