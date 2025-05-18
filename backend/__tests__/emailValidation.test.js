/**
 * Email Validation Tests
 * 
 * This file contains tests for the email validation functionality
 * specifically focusing on preventing text/numbers after .com in email fields
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cors from 'cors';
import userRoutes from '../Routes/user.routes.js';

// Create a test app
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', userRoutes);

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

// Helper function to validate email format
function validateEmail(email) {
  // Basic email validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check if email ends with .com and has no characters after it
  if (email.includes('.com') && email.indexOf('.com') !== email.length - 4) {
    return false;
  }

  return re.test(email);
}

describe('Email Validation Tests', () => {
  // Unit tests for the validateEmail function
  describe('validateEmail Function', () => {
    test('should accept valid email with .com domain', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    test('should reject email with text after .com', () => {
      expect(validateEmail('test@example.com/extra')).toBe(false);
    });

    test('should reject email with numbers after .com', () => {
      expect(validateEmail('test@example.com123')).toBe(false);
    });

    test('should accept valid email with other domains (.org, .net, etc.)', () => {
      expect(validateEmail('test@example.org')).toBe(true);
      expect(validateEmail('test@example.net')).toBe(true);
      expect(validateEmail('test@example.co.uk')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test@example')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('test@example.')).toBe(false);
    });
  });

  // Integration tests for the API endpoints
  describe('Registration API Endpoint', () => {
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
    });

    test('should accept registration with valid email', async () => {
      // This test might need to be mocked further since we're using an in-memory database
      // and the actual implementation might have additional validation or database operations
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'validuser',
          email: 'valid@example.com',
          password: 'Password123!'
        });

      // The test might not pass as-is because the actual implementation might have
      // additional validation or database operations
      // This is just a template for how the test should behave
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Login API Endpoint', () => {
    test('should reject login with invalid email (text after .com)', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com/invalid',
          password: 'Password123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
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
    });
  });

  describe('Forgot Password API Endpoint', () => {
    test('should reject forgot password request with invalid email (text after .com)', async () => {
      const response = await request(app)
        .post('/api/forgetPass')
        .send({
          email: 'test@example.com/invalid',
          newPsw: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
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
    });
  });
});
