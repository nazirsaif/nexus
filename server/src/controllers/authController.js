const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
exports.signup = async (req, res) => {
  try {
    console.log('Signup request received:', req.body);
    const { name, email, password, userType } = req.body;

    // Validate required fields
    if (!name || !email || !password || !userType) {
      console.log('Missing required fields:', { name, email, password: password ? 'provided' : 'missing', userType });
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      userType
    });

    console.log('Attempting to save new user:', { name, email, userType });
    
    // Save user to database
    await user.save();
    console.log('User saved successfully with ID:', user._id);

    // Create JWT token with enhanced security
    const token = jwt.sign(
      { 
        userId: user._id,
        userType: user.userType,
        // Add timestamp to prevent token reuse
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'nexus-secret-key',
      { 
        expiresIn: '1d',
        issuer: 'nexus-platform',
        audience: 'nexus-client'
      }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Signup error:', error.message);
    console.error('Full error:', error);
    
    // Check for validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: validationErrors.join(', ') });
    }
    
    // Check for duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      console.log('Missing required fields for login');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found, checking password');
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Password matched, generating token');
    // Create JWT token with enhanced security
    const token = jwt.sign(
      { 
        userId: user._id,
        userType: user.userType,
        // Add timestamp to prevent token reuse
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'nexus-secret-key',
      { 
        expiresIn: '1d',
        issuer: 'nexus-platform',
        audience: 'nexus-client'
      }
    );

    console.log('Login successful for user:', email);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};