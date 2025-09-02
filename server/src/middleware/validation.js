const { body, validationResult } = require('express-validator');
const validator = require('validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('=== VALIDATION ERRORS ===');
    console.log('Request body:', req.body);
    console.log('Validation errors:', errors.array());
    console.log('========================');
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Custom sanitizer to prevent XSS
const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  
  // Remove HTML tags and escape special characters
  return validator.escape(validator.stripLow(value.trim()));
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces')
    .customSanitizer(sanitizeInput),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces')
    .customSanitizer(sanitizeInput),
  
  body('userType')
    .isIn(['investor', 'entrepreneur'])
    .withMessage('User type must be either investor or entrepreneur'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces')
    .customSanitizer(sanitizeInput),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces')
    .customSanitizer(sanitizeInput),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters')
    .customSanitizer(sanitizeInput),
  
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name must not exceed 100 characters')
    .customSanitizer(sanitizeInput),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// Payment validation
const validatePayment = [
  body('amount')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be a positive number between 0.01 and 1,000,000'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// Transfer validation
const validateTransfer = [
  body('amount')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be a positive number between 0.01 and 1,000,000'),
  
  body('recipientId')
    .notEmpty()
    .withMessage('Recipient ID is required')
    .isMongoId()
    .withMessage('Invalid recipient ID format'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// Withdrawal validation
const validateWithdrawal = [
  body('amount')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be a positive number between 0.01 and 1,000,000'),
  
  body('withdrawMethod')
    .isIn(['bank_transfer', 'paypal'])
    .withMessage('Withdrawal method must be either bank_transfer or paypal'),
  
  body('accountDetails')
    .optional()
    .custom((value, { req }) => {
      if (req.body.withdrawMethod === 'bank_transfer' && (!value || !value.accountNumber || !value.routingNumber || !value.accountHolderName)) {
        throw new Error('Bank account details are required for bank transfers');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters')
    .customSanitizer(sanitizeInput),
  
  body('receiverId')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  
  handleValidationErrors
];

// Document validation
const validateDocument = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Document title must be between 1 and 100 characters')
    .customSanitizer(sanitizeInput),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  body('query')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .customSanitizer(sanitizeInput),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// 2FA validation
const validate2FA = [
  body('otpCode')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers')
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validatePayment,
  validateTransfer,
  validateWithdrawal,
  validateMessage,
  validateDocument,
  validateSearch,
  validatePasswordChange,
  validate2FA,
  handleValidationErrors,
  sanitizeInput
};