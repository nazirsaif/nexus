const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  userType: {
    type: String,
    enum: ['entrepreneur', 'investor'],
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  avatarUrl: {
    type: String,
    default: '/default-avatar.png'
  },
  location: {
    type: String
  },
  website: {
    type: String
  },
  social: {
    linkedin: { type: String },
    twitter: { type: String },
    instagram: { type: String }
  },
  // Entrepreneur specific fields
  startupName: { type: String },
  industry: { type: String },
  pitchSummary: { type: String },
  fundingNeeded: { type: String },
  teamSize: { type: Number },
  foundedYear: { type: Number },
  // Investor specific fields
  investmentInterests: { type: [String] },
  investmentStage: { type: [String] },
  portfolioCompanies: { type: [String] },
  minimumInvestment: { type: String },
  maximumInvestment: { type: String },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);