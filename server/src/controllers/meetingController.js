const Meeting = require('../models/Meeting');
const User = require('../models/User');

// Get all meetings for the current user
exports.getMeetings = async (req, res) => {
  try {
    // Find meetings where the current user is a participant
    const meetings = await Meeting.find({
      'participants.userId': req.user.id
    }).sort({ startTime: 1 }); // Sort by start time ascending
    
    res.json(meetings);
  } catch (error) {
    console.error('Get meetings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single meeting by ID
exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if the current user is a participant
    const isParticipant = meeting.participants.some(
      participant => participant.userId.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to view this meeting' });
    }
    
    res.json(meeting);
  } catch (error) {
    console.error('Get meeting by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new meeting
exports.createMeeting = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      participants, 
      startTime, 
      endTime, 
      location, 
      meetingLink, 
      notes 
    } = req.body;
    
    // Validate required fields
    if (!title || !startTime || !endTime || !participants || participants.length === 0) {
      return res.status(400).json({ 
        message: 'Title, start time, end time, and at least one participant are required' 
      });
    }
    
    // Validate that start time is before end time
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({ 
        message: 'Start time must be before end time' 
      });
    }
    
    // Check for scheduling conflicts for all participants
    const conflictPromises = participants.map(async participant => {
      const conflicts = await Meeting.find({
        'participants.userId': participant.userId,
        status: { $in: ['pending', 'accepted'] },
        $or: [
          // New meeting starts during an existing meeting
          {
            startTime: { $lte: new Date(startTime) },
            endTime: { $gt: new Date(startTime) }
          },
          // New meeting ends during an existing meeting
          {
            startTime: { $lt: new Date(endTime) },
            endTime: { $gte: new Date(endTime) }
          },
          // New meeting completely contains an existing meeting
          {
            startTime: { $gte: new Date(startTime) },
            endTime: { $lte: new Date(endTime) }
          }
        ]
      });
      
      return { userId: participant.userId, conflicts };
    });
    
    const conflictResults = await Promise.all(conflictPromises);
    
    // Check if any participant has conflicts
    const participantsWithConflicts = conflictResults.filter(
      result => result.conflicts.length > 0
    );
    
    if (participantsWithConflicts.length > 0) {
      // Get user details for the conflicts
      const conflictingUsers = await User.find({
        _id: { $in: participantsWithConflicts.map(p => p.userId) }
      }).select('name email');
      
      return res.status(409).json({
        message: 'Scheduling conflict detected',
        conflicts: participantsWithConflicts.map(p => {
          const user = conflictingUsers.find(u => u._id.toString() === p.userId.toString());
          return {
            userId: p.userId,
            userName: user ? user.name : 'Unknown',
            conflictCount: p.conflicts.length,
            conflictingMeetings: p.conflicts.map(c => ({
              id: c._id,
              title: c.title,
              startTime: c.startTime,
              endTime: c.endTime
            }))
          };
        })
      });
    }
    
    // Create new meeting
    const newMeeting = new Meeting({
      title,
      description,
      participants,
      startTime,
      endTime,
      location,
      meetingLink,
      notes,
      createdBy: req.user.id,
      status: 'pending' // Default status for new meetings
    });
    
    await newMeeting.save();
    
    res.status(201).json(newMeeting);
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a meeting
exports.updateMeeting = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      participants, 
      startTime, 
      endTime, 
      location, 
      meetingLink, 
      notes 
    } = req.body;
    
    // Find the meeting
    let meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if the current user is the creator of the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this meeting' });
    }
    
    // Build meeting update object
    const meetingFields = {};
    if (title) meetingFields.title = title;
    if (description !== undefined) meetingFields.description = description;
    if (participants) meetingFields.participants = participants;
    if (startTime) meetingFields.startTime = startTime;
    if (endTime) meetingFields.endTime = endTime;
    if (location !== undefined) meetingFields.location = location;
    if (meetingLink !== undefined) meetingFields.meetingLink = meetingLink;
    if (notes !== undefined) meetingFields.notes = notes;
    
    // If start or end time is being updated, check for conflicts
    if (startTime || endTime) {
      const newStartTime = startTime ? new Date(startTime) : meeting.startTime;
      const newEndTime = endTime ? new Date(endTime) : meeting.endTime;
      
      // Validate that start time is before end time
      if (newStartTime >= newEndTime) {
        return res.status(400).json({ 
          message: 'Start time must be before end time' 
        });
      }
      
      // Get participants to check for conflicts
      const participantsToCheck = participants || meeting.participants;
      
      // Check for scheduling conflicts for all participants
      const conflictPromises = participantsToCheck.map(async participant => {
        const conflicts = await Meeting.find({
          _id: { $ne: req.params.id }, // Exclude the current meeting
          'participants.userId': participant.userId,
          status: { $in: ['pending', 'accepted'] },
          $or: [
            // Meeting starts during an existing meeting
            {
              startTime: { $lte: newStartTime },
              endTime: { $gt: newStartTime }
            },
            // Meeting ends during an existing meeting
            {
              startTime: { $lt: newEndTime },
              endTime: { $gte: newEndTime }
            },
            // Meeting completely contains an existing meeting
            {
              startTime: { $gte: newStartTime },
              endTime: { $lte: newEndTime }
            }
          ]
        });
        
        return { userId: participant.userId, conflicts };
      });
      
      const conflictResults = await Promise.all(conflictPromises);
      
      // Check if any participant has conflicts
      const participantsWithConflicts = conflictResults.filter(
        result => result.conflicts.length > 0
      );
      
      if (participantsWithConflicts.length > 0) {
        // Get user details for the conflicts
        const conflictingUsers = await User.find({
          _id: { $in: participantsWithConflicts.map(p => p.userId) }
        }).select('name email');
        
        return res.status(409).json({
          message: 'Scheduling conflict detected',
          conflicts: participantsWithConflicts.map(p => {
            const user = conflictingUsers.find(u => u._id.toString() === p.userId.toString());
            return {
              userId: p.userId,
              userName: user ? user.name : 'Unknown',
              conflictCount: p.conflicts.length,
              conflictingMeetings: p.conflicts.map(c => ({
                id: c._id,
                title: c.title,
                startTime: c.startTime,
                endTime: c.endTime
              }))
            };
          })
        });
      }
    }
    
    // Update meeting
    meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      { $set: meetingFields },
      { new: true }
    );
    
    res.json(meeting);
  } catch (error) {
    console.error('Update meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update meeting status (accept, reject, cancel)
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!status || !['pending', 'accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        message: 'Valid status (pending, accepted, rejected, cancelled) is required' 
      });
    }
    
    // Find the meeting
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if the current user is a participant
    const isParticipant = meeting.participants.some(
      participant => participant.userId.toString() === req.user.id
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'Not authorized to update this meeting' });
    }
    
    // If cancelling, only the creator can cancel
    if (status === 'cancelled' && meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the meeting creator can cancel the meeting' });
    }
    
    // Update meeting status
    meeting.status = status;
    await meeting.save();
    
    res.json(meeting);
  } catch (error) {
    console.error('Update meeting status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a meeting
exports.deleteMeeting = async (req, res) => {
  try {
    // Find the meeting
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    // Check if the current user is the creator of the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this meeting' });
    }
    
    await Meeting.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Delete meeting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};