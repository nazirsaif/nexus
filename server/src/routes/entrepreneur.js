const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Apply role middleware to ensure only entrepreneurs can access these routes
router.use(roleAuth(['entrepreneur']));

// Get entrepreneur dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    // In a real application, you would fetch entrepreneur-specific data here
    // For now, we'll just return some basic info
    res.json({
      success: true,
      message: 'Entrepreneur dashboard data retrieved successfully',
      data: {
        user: req.user,
        // Add more entrepreneur-specific data here
      }
    });
  } catch (error) {
    console.error('Entrepreneur dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Additional entrepreneur-specific routes can be added here

module.exports = router;