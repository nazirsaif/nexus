const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from Authorization header, x-auth-token header, query string or cookies
    let token = req.header('Authorization') || req.header('x-auth-token') || 
                req.query.token || 
                (req.cookies && req.cookies.token);
    
    // Check if token is in Authorization header with Bearer prefix
    if (token && token.startsWith('Bearer ')) {
      // Remove Bearer from string
      token = token.slice(7).trim();
    }
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No authentication token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexus-secret-key');
      
      // Check if decoded token has userId
      if (!decoded.userId) {
        return res.status(401).json({ 
          message: 'Invalid token format. No user ID found.'
        });
      }
      
      // Check if token has expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return res.status(401).json({ 
          message: 'Token has expired. Please login again.'
        });
      }

      // Add user from payload
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          message: 'Invalid token. User not found.'
        });
      }
      
      // Attach user and token data to request
      req.user = user;
      req.token = token;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ 
        message: 'Invalid authentication token.'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Server error during authentication.'
    });
  }
};