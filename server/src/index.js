const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

// Import security middleware
const { 
  helmetConfig, 
  corsOptions, 
  generalLimiter,
  sanitizeRequest,
  preventXSS,
  securityLogger 
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');
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

// Security middleware (apply first)
app.use(helmetConfig);
app.use(securityLogger);
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(preventXSS);
app.use(sanitizeRequest);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
connectDB();

// Swagger API Documentation
const { swaggerUi, specs } = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Nexus API Documentation'
}));

// Routes
app.use('/api/auth', authRoutes);
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
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Socket.IO server initialized for WebRTC signaling');
});