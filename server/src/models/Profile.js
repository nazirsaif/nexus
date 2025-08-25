const mongoose = require('mongoose');

// Base schema for common profile fields
const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String
  },
  social: {
    linkedin: { type: String },
    twitter: { type: String },
    instagram: { type: String }
  },
  // Fields specific to entrepreneurs
  entrepreneur: {
    startupName: { type: String },
    foundedYear: { type: Number },
    pitchSummary: { type: String },
    fundingNeeded: { type: String },
    industry: { type: String },
    teamSize: { type: Number },
    startupHistory: [{
      companyName: { type: String },
      role: { type: String },
      yearStarted: { type: Number },
      yearEnded: { type: Number },
      description: { type: String }
    }]
  },
  // Fields specific to investors
  investor: {
    investmentInterests: [{ type: String }],
    investmentStage: [{ type: String }],
    portfolioCompanies: [{ type: String }],
    minimumInvestment: { type: String },
    maximumInvestment: { type: String },
    totalInvestments: { type: Number },
    investmentHistory: [{
      companyName: { type: String },
      amount: { type: String },
      year: { type: Number },
      exitStatus: { type: String },
      description: { type: String }
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
ProfileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Profile', ProfileSchema);