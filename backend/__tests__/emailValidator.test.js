/**
 * Email Validator Utility Tests
 * 
 * This file contains tests for the email validator utility functions
 * specifically focusing on preventing text/numbers after .com in email fields
 */

import { validateEmail, validateEmailWithMessage } from '../utils/emailValidator.js';

describe('Email Validator Utility Tests', () => {
  describe('validateEmail Function', () => {
    test('should return true for valid email with .com domain', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    test('should return false for email with text after .com', () => {
      expect(validateEmail('test@example.com/extra')).toBe(false);
    });

    test('should return false for email with numbers after .com', () => {
      expect(validateEmail('test@example.com123')).toBe(false);
    });

    test('should return true for valid email with other domains', () => {
      expect(validateEmail('test@example.org')).toBe(true);
      expect(validateEmail('test@example.net')).toBe(true);
      expect(validateEmail('test@example.co.uk')).toBe(true);
    });

    test('should return false for invalid email formats', () => {
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test@example')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('test@example.')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
    });
  });

  describe('validateEmailWithMessage Function', () => {
    test('should return isValid=true for valid email with .com domain', () => {
      const result = validateEmailWithMessage('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeNull();
    });

    test('should return specific error for email with text after .com', () => {
      const result = validateEmailWithMessage('test@example.com/extra');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('No characters allowed after .com');
    });

    test('should return specific error for email with numbers after .com', () => {
      const result = validateEmailWithMessage('test@example.com123');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('No characters allowed after .com');
    });

    test('should return generic error for invalid email format', () => {
      const result = validateEmailWithMessage('test@example');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Please enter a valid email');
    });

    test('should return required error for missing email', () => {
      const result = validateEmailWithMessage('');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Email is required');
    });

    test('should handle null and undefined', () => {
      expect(validateEmailWithMessage(null).isValid).toBe(false);
      expect(validateEmailWithMessage(undefined).isValid).toBe(false);
    });
  });
});
