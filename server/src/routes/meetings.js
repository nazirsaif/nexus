const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Meeting = require('../models/Meeting');

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Get all meetings
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find meetings where the user is either the organizer or a participant
    const meetings = await Meeting.find({
      $or: [
        { organizerId: userId },
        { 'participants.userId': userId }
      ]
    });
    
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new meeting
router.post('/', async (req, res) => {
  try {
    const { title, description, startTime, endTime, location, participants } = req.body;
    const organizerId = req.user.id; // Get organizer ID from authenticated user
    
    // Validate required fields
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create new meeting with MongoDB model
    const newMeeting = new Meeting({
      title,
      description,
      startTime,
      endTime,
      location,
      organizerId,
      participants: participants.map(userId => ({ userId, status: 'pending' })),
      status: 'scheduled'
    });
    
    // Save to database
    await newMeeting.save();
    
    res.status(201).json(newMeeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single meeting
router.get('/:id', async (req, res) => {
  try {
    // In a real application, you would fetch the meeting from a database
    // For now, we'll just return a 404
    res.status(404).json({ message: 'Meeting not found' });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a meeting
router.delete('/:id', async (req, res) => {
  try {
    // In a real application, you would delete the meeting from a database
    // For now, we'll just return a success message
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update meeting status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!status || !['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // In a real application, you would update the meeting in a database
    // For now, we'll just return a success message
    res.json({ message: 'Meeting status updated successfully' });
  } catch (error) {
    console.error('Error updating meeting status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single meeting by ID
router.get('/:id', async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    res.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update meeting status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // If user is the organizer, update the meeting status
    if (meeting.organizerId === userId) {
      meeting.status = status;
      await meeting.save();
      return res.json(meeting);
    }
    
    // If user is a participant, update their status
    const participantIndex = meeting.participants.findIndex(p => p.userId === userId);
    
    if (participantIndex === -1) {
      return res.status(403).json({ message: 'Not authorized to update this meeting' });
    }
    
    meeting.participants[participantIndex].status = status;
    await meeting.save();
    
    res.json(meeting);
  } catch (error) {
    console.error('Error updating meeting status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a meeting
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Only the organizer can delete a meeting
    if (meeting.organizerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this meeting' });
    }
    
    await Meeting.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;