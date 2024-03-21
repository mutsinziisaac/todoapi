import request from "supertest";
import app from "./app";

describe("GET /api/todos", () => {
  it("should return all todos", async () => {
    const response = await request(app).get("/api/todos");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  }, 10000);
});

describe("POST /api/todos", () => {
  it("should create a new todo successfully", async () => {
    const todoData = { todo: "Test todo" };
    const response = await request(app).post("/api/todos").send(todoData);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("todo saved successfully");
  });
});

describe("GET /api/todos/:id", () => {
  it("should return a specific todo by its ID", async () => {
    // Assuming there is at least one todo in the database
    const allTodosResponse = await request(app).get("/api/todos");
    const todoId = allTodosResponse.body[0]._id; // Assuming the first todo's ID is used for testing
    const response = await request(app).get(`/api/todos/${todoId}`);
    expect(response.status).toBe(200);
    expect(response.body._id).toBe(todoId);
    // Add more assertions as needed to check the structure and content of the response
  });
});

describe("DELETE /api/todos/:id", () => {
  it("should delete an existing todo successfully", async () => {
    // Assuming there is at least one todo in the database
    const allTodosResponse = await request(app).get("/api/todos");
    const todoId = allTodosResponse.body[0]._id; // Assuming the first todo's ID is used for testing
    const response = await request(app).delete(`/api/todos/${todoId}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe("todo deleted");
    // Add more assertions as needed
  });
});
