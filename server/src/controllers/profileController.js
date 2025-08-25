const User = require('../models/User');
const Profile = require('../models/Profile');

// Get user profile with extended information
exports.getProfile = async (req, res) => {
  try {
    // User is already attached to req by auth middleware
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get extended profile information
    let profile = await Profile.findOne({ user: req.user.id });
    
    // If no profile exists, return just the user data
    if (!profile) {
      return res.json({
        user,
        profile: null
      });
    }
    
    // Return user and profile data
    res.json({
      user,
      profile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, bio, location, website, social, entrepreneurData, investorData } = req.body;
    
    // Build user update object
    const userFields = {};
    if (name) userFields.name = name;
    if (email) {
      // Check if email is already in use by another user
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      userFields.email = email;
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    // Build profile update object
    const profileFields = {
      user: req.user.id
    };
    
    if (bio) profileFields.bio = bio;
    if (location) profileFields.location = location;
    if (website) profileFields.website = website;
    if (social) profileFields.social = social;
    
    // Add role-specific data
    if (user.userType === 'entrepreneur' && entrepreneurData) {
      profileFields.entrepreneur = entrepreneurData;
    }
    
    if (user.userType === 'investor' && investorData) {
      profileFields.investor = investorData;
    }
    
    // Check if profile exists
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (profile) {
      // Update existing profile
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
    } else {
      // Create new profile
      profile = new Profile(profileFields);
      await profile.save();
    }
    
    res.json({
      user,
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id);
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};