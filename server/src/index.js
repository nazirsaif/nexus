const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const entrepreneurRoutes = require('./routes/entrepreneur');
const investorRoutes = require('./routes/investor');
const profileRoutes = require('./routes/profile');
const meetingsRoutes = require('./routes/meetings');
const usersRoutes = require('./routes/users');
const videoCallRoutes = require('./routes/videoCalls');
const documentRoutes = require('./routes/documents');
const paymentRoutes = require('./routes/payments');

// Initialize express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/entrepreneur', entrepreneurRoutes);
app.use('/api/investor', investorRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/meetings', meetingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/video-calls', videoCallRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Nexus API is running');
});

// WebRTC Signaling with Socket.IO
const activeRooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a video call room
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    
    // Track active rooms and participants
    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Set());
    }
    activeRooms.get(roomId).add(userId);
    
    // Notify others in the room
    socket.to(roomId).emit('user-connected', userId);
    
    console.log(`User ${userId} joined room ${roomId}`);
  });

  // WebRTC signaling events
  socket.on('offer', (roomId, offer, targetUserId) => {
    socket.to(roomId).emit('offer', offer, socket.id, targetUserId);
  });

  socket.on('answer', (roomId, answer, targetUserId) => {
    socket.to(roomId).emit('answer', answer, socket.id, targetUserId);
  });

  socket.on('ice-candidate', (roomId, candidate, targetUserId) => {
    socket.to(roomId).emit('ice-candidate', candidate, socket.id, targetUserId);
  });

  // Media control events
  socket.on('toggle-audio', (roomId, userId, isAudioEnabled) => {
    socket.to(roomId).emit('user-audio-toggled', userId, isAudioEnabled);
  });

  socket.on('toggle-video', (roomId, userId, isVideoEnabled) => {
    socket.to(roomId).emit('user-video-toggled', userId, isVideoEnabled);
  });

  // Leave room
  socket.on('leave-room', (roomId, userId) => {
    socket.leave(roomId);
    
    if (activeRooms.has(roomId)) {
      activeRooms.get(roomId).delete(userId);
      if (activeRooms.get(roomId).size === 0) {
        activeRooms.delete(roomId);
      }
    }
    
    socket.to(roomId).emit('user-disconnected', userId);
    console.log(`User ${userId} left room ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up user from all rooms
    activeRooms.forEach((participants, roomId) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        socket.to(roomId).emit('user-disconnected', socket.id);
        if (participants.size === 0) {
          activeRooms.delete(roomId);
        }
      }
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO server initialized for WebRTC signaling');
});