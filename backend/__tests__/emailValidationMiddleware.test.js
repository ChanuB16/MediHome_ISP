/**
 * Email Validation Middleware Tests
 * 
 * This file contains tests for the email validation middleware
 * specifically focusing on preventing text/numbers after .com in email fields
 */

import { validateEmailMiddleware } from '../middleware/emailValidation.js';

describe('Email Validation Middleware Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('should call next() for valid email with .com domain', () => {
    req.body.email = 'test@example.com';
    validateEmailMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  test('should return 400 for email with text after .com', () => {
    req.body.email = 'test@example.com/extra';
    validateEmailMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'No characters allowed after .com'
    });
  });

  test('should return 400 for email with numbers after .com', () => {
    req.body.email = 'test@example.com123';
    validateEmailMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'No characters allowed after .com'
    });
  });

  test('should return 400 for missing email', () => {
    validateEmailMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Email is required'
    });
  });

  test('should return 400 for invalid email format', () => {
    req.body.email = 'test@example';
    validateEmailMiddleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Please enter a valid email'
    });
  });

  test('should call next() for valid email with other domains', () => {
    req.body.email = 'test@example.org';
    validateEmailMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
