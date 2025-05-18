# Email Validation Tests

This directory contains tests for the email validation functionality, specifically focusing on preventing text/numbers after .com in email fields.

## Test Files

- `emailValidation.test.js`: Tests for the email validation functionality
- `emailValidationMiddleware.test.js`: Tests for the email validation middleware
- `emailValidator.test.js`: Tests for the email validator utility functions
- `userRoutes.test.js`: Tests for the user routes API endpoints that use email validation

## Running Tests

To run the tests, you need to have Node.js and npm installed. Then, you can run the following commands from the `backend` directory:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (automatically re-run tests when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The tests cover the following aspects of email validation:

1. **Basic Validation**: Ensures that emails follow the standard format (user@domain.tld)
2. **No Characters After .com**: Specifically checks that emails ending with .com don't have any characters after the .com
3. **API Endpoints**: Tests that the API endpoints properly validate emails
4. **Middleware**: Tests that the middleware correctly validates emails and returns appropriate error messages
5. **Utility Functions**: Tests the utility functions that are used for email validation

## Implementation Details

The email validation is implemented in three main components:

1. **Utility Functions** (`utils/emailValidator.js`): Contains functions for validating emails
2. **Middleware** (`middleware/emailValidation.js`): Express middleware that validates emails in API requests
3. **API Routes** (`Routes/user.routes.js`): API endpoints that use the middleware to validate emails

The validation logic specifically checks for characters after .com by using the following code:

```javascript
if (email.includes('.com') && email.indexOf('.com') !== email.length - 4) {
  return false;
}
```

This ensures that if an email contains ".com", it must be at the end of the string (with no characters after it).
