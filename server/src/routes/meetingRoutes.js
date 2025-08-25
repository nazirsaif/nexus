const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const meetingController = require('../controllers/meetingController');

// @route   GET api/meetings
// @desc    Get all meetings for the current user
// @access  Private
router.get('/', auth, meetingController.getMeetings);

// @route   GET api/meetings/:id
// @desc    Get a meeting by ID
// @access  Private
router.get('/:id', auth, meetingController.getMeetingById);

// @route   POST api/meetings
// @desc    Create a new meeting
// @access  Private
router.post('/', auth, meetingController.createMeeting);

// @route   PUT api/meetings/:id
// @desc    Update a meeting
// @access  Private
router.put('/:id', auth, meetingController.updateMeeting);

// @route   PATCH api/meetings/:id/status
// @desc    Update meeting status (accept, reject, cancel)
// @access  Private
router.patch('/:id/status', auth, meetingController.updateMeetingStatus);

// @route   DELETE api/meetings/:id
// @desc    Delete a meeting
// @access  Private
router.delete('/:id', auth, meetingController.deleteMeeting);

module.exports = router;