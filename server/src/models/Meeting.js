const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Store both participants (entrepreneur and investor)
  participants: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      userType: {
        type: String,
        enum: ['entrepreneur', 'investor'],
        required: true
      }
    }
  ],
  // Meeting date and time
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  // Meeting status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  // Who created the meeting
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Optional location (could be virtual or physical)
  location: {
    type: String,
    default: 'Virtual'
  },
  // Optional meeting link for virtual meetings
  meetingLink: {
    type: String
  },
  // Optional notes
  notes: {
    type: String
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
MeetingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Meeting', MeetingSchema);