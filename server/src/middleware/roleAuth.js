const User = require('../models/User');

/**
 * Middleware to check if user has the required role
 * @param {string[]} roles - Array of allowed roles
 * @returns {function} - Express middleware function
 */
module.exports = (roles) => {
  return async (req, res, next) => {
    try {
      // User should already be attached to req by the auth middleware
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user's role is in the allowed roles array
      if (!roles.includes(req.user.userType)) {
        return res.status(403).json({ 
          message: 'Access denied. You do not have permission to access this resource.'
        });
      }

      // User has required role, proceed
      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({ message: 'Server error during role verification' });
    }
  };
};