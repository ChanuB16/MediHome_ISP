/**
 * Email Validator Utility
 * 
 * This utility provides functions for validating email addresses,
 * specifically focusing on preventing text/numbers after .com
 */

/**
 * Validates an email address format
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if the email is valid, false otherwise
 */
export function validateEmail(email) {
  // Basic email validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check if email ends with .com and has no characters after it
  if (email.includes('.com') && email.indexOf('.com') !== email.length - 4) {
    return false;
  }

  return re.test(email);
}

/**
 * Validates an email address and returns an error message if invalid
 * @param {string} email - The email address to validate
 * @returns {Object} - { isValid: boolean, errorMessage: string | null }
 */
export function validateEmailWithMessage(email) {
  if (!email) {
    return { isValid: false, errorMessage: "Email is required" };
  }
  
  if (!validateEmail(email)) {
    if (email.includes('.com') && email.indexOf('.com') !== email.length - 4) {
      return { isValid: false, errorMessage: "No characters allowed after .com" };
    } else {
      return { isValid: false, errorMessage: "Please enter a valid email" };
    }
  }
  
  return { isValid: true, errorMessage: null };
}

export default {
  validateEmail,
  validateEmailWithMessage
};
