/**
 * User Routes API Tests
 * 
 * This file contains tests for the user routes API endpoints
 * specifically focusing on email validation to prevent text/numbers after .com
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cors from 'cors';
import userRoutes from '../Routes/user.routes.js';
import { validateEmailMiddleware } from '../middleware/emailValidation.js';

// Create a test app with middleware
const app = express();
app.use(cors());
app.use(express.json());

// Apply email validation middleware to specific routes
app.post('/api/register', validateEmailMiddleware, (req, res) => {
  // Mock implementation for testing
  res.status(201).json({ success: true, message: "User registered successfully" });
});

app.post('/api/login', validateEmailMiddleware, (req, res) => {
  // Mock implementation for testing
  res.status(200).json({ success: true, message: "Login successful" });
});

app.post('/api/forgetPass', validateEmailMiddleware, (req, res) => {
  // Mock implementation for testing
  res.status(200).json({ success: true, message: "Password reset successful" });
});

let mongoServer;

// Setup and teardown for tests
beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Routes API Tests', () => {
  describe('POST /api/register', () => {
    test('should reject registration with invalid email (text after .com)', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com/invalid',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No characters allowed after .com');
    });

    test('should reject registration with invalid email (numbers after .com)', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          email: 'test@example.com123',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No characters allowed after .com');
    });

    test('should accept registration with valid email', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'validuser',
          email: 'valid@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/login', () => {
    test('should reject login with invalid email (text after .com)', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com/invalid',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No characters allowed after .com');
    });

    test('should reject login with invalid email (numbers after .com)', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com123',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No characters allowed after .com');
    });

    test('should accept login with valid email', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'valid@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/forgetPass', () => {
    test('should reject forgot password request with invalid email (text after .com)', async () => {
      const response = await request(app)
        .post('/api/forgetPass')
        .send({
          email: 'test@example.com/invalid',
          newPsw: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No characters allowed after .com');
    });

    test('should reject forgot password request with invalid email (numbers after .com)', async () => {
      const response = await request(app)
        .post('/api/forgetPass')
        .send({
          email: 'test@example.com123',
          newPsw: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No characters allowed after .com');
    });

    test('should accept forgot password request with valid email', async () => {
      const response = await request(app)
        .post('/api/forgetPass')
        .send({
          email: 'valid@example.com',
          newPsw: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
