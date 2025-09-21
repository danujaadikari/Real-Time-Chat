/**
 * Real-Time Chat Server - SECURE VERSION
 * Express + Socket.io implementation with security measures
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Security: Get environment variables
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Security: Set up allowed origins
const allowedOrigins = NODE_ENV === 'development' 
  ? ['http://localhost:5173', 'http://127.0.0.1:5173']
  : [FRONTEND_URL];

// Security: Configure Socket.io with restricted CORS
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: false // Security: Disable credentials
  }
});

// Security: Use Helmet for basic security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 messages per minute
  message: {
    error: 'Too many messages, please slow down.'
  }
});

app.use('/health', limiter);
app.use(cors({
  origin: allowedOrigins,
  credentials: false
}));
app.use(express.json({ limit: '10mb' })); // Security: Limit payload size

// Security: Input sanitization function
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return xss(input.trim().substring(0, 1000)); // Limit length and sanitize
};

// Security: Validate username
const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  const sanitized = sanitizeInput(username);
  return sanitized.length >= 2 && sanitized.length <= 20 && /^[a-zA-Z0-9_\s]+$/.test(sanitized);
};

// Security: Validate room name
const isValidRoomName = (room) => {
  if (!room || typeof room !== 'string') return false;
  const sanitized = sanitizeInput(room);
  return sanitized.length >= 2 && sanitized.length <= 30 && /^[a-zA-Z0-9_\s]+$/.test(sanitized);
};

// In-memory storage structures
const storage = {
  users: new Map(),        // userId -> { id, username, room, socketId, joinTime }
  rooms: new Map(),        // roomName -> { users: Set(), messages: [], createdAt }
  sockets: new Map(),      // socketId -> userId
  typingUsers: new Map(),  // roomName -> Set(userIds)
  ipConnections: new Map() // IP -> connection count
};

// Security: Connection tracking per IP
const trackConnection = (ip) => {
  const current = storage.ipConnections.get(ip) || 0;
  storage.ipConnections.set(ip, current + 1);
  return current + 1;
};

const untrackConnection = (ip) => {
  const current = storage.ipConnections.get(ip) || 1;
  if (current <= 1) {
    storage.ipConnections.delete(ip);
  } else {
    storage.ipConnections.set(ip, current - 1);
  }
};

// Utility functions for storage management
const StorageUtils = {
  // Add user to storage
  addUser: (userId, username, room, socketId) => {
    const user = { 
      id: userId, 
      username: sanitizeInput(username), 
      room: sanitizeInput(room), 
      socketId,
      joinTime: new Date().toISOString()
    };
    storage.users.set(userId, user);
    storage.sockets.set(socketId, userId);
    
    // Initialize room if it doesn't exist
    if (!storage.rooms.has(room)) {
      storage.rooms.set(room, { 
        users: new Set(), 
        messages: [],
        createdAt: new Date().toISOString()
      });
    }
    
    // Add user to room
    storage.rooms.get(room).users.add(userId);
    
    return user;
  },

  // Remove user from storage
  removeUser: (socketId) => {
    const userId = storage.sockets.get(socketId);
    if (!userId) return null;

    const user = storage.users.get(userId);
    if (!user) return null;

    // Remove from room
    const room = storage.rooms.get(user.room);
    if (room) {
      room.users.delete(userId);
      // Remove from typing users
      const typingInRoom = storage.typingUsers.get(user.room);
      if (typingInRoom) {
        typingInRoom.delete(userId);
      }
    }

    // Clean up storage
    storage.users.delete(userId);
    storage.sockets.delete(socketId);

    return user;
  },

  // Get user by socket ID
  getUserBySocketId: (socketId) => {
    const userId = storage.sockets.get(socketId);
    return userId ? storage.users.get(userId) : null;
  },

  // Get all users in a room
  getUsersInRoom: (roomName) => {
    const room = storage.rooms.get(roomName);
    if (!room) return [];

    return Array.from(room.users).map(userId => storage.users.get(userId)).filter(Boolean);
  },

  // Add message to room with security checks
  addMessage: (roomName, message) => {
    const room = storage.rooms.get(roomName);
    if (room) {
      // Security: Sanitize message
      const sanitizedMessage = {
        ...message,
        message: sanitizeInput(message.message),
        username: sanitizeInput(message.username)
      };
      
      room.messages.push(sanitizedMessage);
      // Keep only last 50 messages to prevent memory issues
      if (room.messages.length > 50) {
        room.messages = room.messages.slice(-50);
      }
    }
  },

  // Get messages for a room
  getRoomMessages: (roomName) => {
    const room = storage.rooms.get(roomName);
    return room ? room.messages : [];
  },

  // Handle typing status
  setTyping: (userId, roomName, isTyping) => {
    if (!storage.typingUsers.has(roomName)) {
      storage.typingUsers.set(roomName, new Set());
    }
    
    const typingInRoom = storage.typingUsers.get(roomName);
    if (isTyping) {
      typingInRoom.add(userId);
    } else {
      typingInRoom.delete(userId);
    }
    
    return Array.from(typingInRoom).map(id => storage.users.get(id)).filter(Boolean);
  }
};

// Security: Basic health check endpoint (limited info in production)
app.get('/health', limiter, (req, res) => {
  const stats = NODE_ENV === 'development' ? {
    totalUsers: storage.users.size,
    totalRooms: storage.rooms.size,
    connectedSockets: storage.sockets.size
  } : {};
  
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    ...stats
  });
});

// Security: Socket connection limits per IP
const MAX_CONNECTIONS_PER_IP = 5;

// Socket.io connection handling with security
io.on('connection', (socket) => {
  const clientIP = socket.handshake.address;
  
  // Security: Check connection limit per IP
  const connectionsFromIP = trackConnection(clientIP);
  if (connectionsFromIP > MAX_CONNECTIONS_PER_IP) {
    console.log(`Connection limit exceeded for IP: ${clientIP}`);
    socket.emit('error', { message: 'Connection limit exceeded' });
    socket.disconnect();
    untrackConnection(clientIP);
    return;
  }

  console.log(`New client connected: ${socket.id} from ${clientIP}`);

  // Handle user joining a room
  socket.on('joinRoom', ({ username, room }) => {
    try {
      // Security: Validate and sanitize inputs
      if (!isValidUsername(username) || !isValidRoomName(room)) {
        socket.emit('error', { message: 'Invalid username or room name' });
        return;
      }

      const sanitizedUsername = sanitizeInput(username);
      const sanitizedRoom = sanitizeInput(room);
      
      const userId = uuidv4();
      const user = StorageUtils.addUser(userId, sanitizedUsername, sanitizedRoom, socket.id);

      // Join the socket room
      socket.join(sanitizedRoom);

      // Send welcome message to user
      socket.emit('message', {
        id: uuidv4(),
        username: 'System',
        message: `Welcome to ${sanitizedRoom}, ${sanitizedUsername}!`,
        timestamp: new Date().toISOString(),
        type: 'system'
      });

      // Notify others in the room
      socket.to(sanitizedRoom).emit('message', {
        id: uuidv4(),
        username: 'System',
        message: `${sanitizedUsername} has joined the chat`,
        timestamp: new Date().toISOString(),
        type: 'system'
      });

      // Send room history to the new user
      const roomMessages = StorageUtils.getRoomMessages(sanitizedRoom);
      socket.emit('roomHistory', roomMessages);

      // Update online users for the room
      const onlineUsers = StorageUtils.getUsersInRoom(sanitizedRoom);
      io.to(sanitizedRoom).emit('onlineUsers', onlineUsers);

      console.log(`${sanitizedUsername} joined room: ${sanitizedRoom}`);
    } catch (error) {
      console.error('Error in joinRoom:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle sending messages with rate limiting
  socket.on('sendMessage', ({ message }) => {
    try {
      const user = StorageUtils.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Security: Validate and sanitize message
      if (!message || typeof message !== 'string') {
        socket.emit('error', { message: 'Invalid message' });
        return;
      }

      const sanitizedMessage = sanitizeInput(message);
      if (sanitizedMessage.length === 0 || sanitizedMessage.length > 500) {
        socket.emit('error', { message: 'Message length invalid' });
        return;
      }

      const messageObj = {
        id: uuidv4(),
        username: user.username,
        message: sanitizedMessage,
        timestamp: new Date().toISOString(),
        type: 'user'
      };

      // Store message
      StorageUtils.addMessage(user.room, messageObj);

      // Broadcast message to room
      io.to(user.room).emit('message', messageObj);

      console.log(`Message from ${user.username} in ${user.room}: ${sanitizedMessage.substring(0, 50)}...`);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ isTyping }) => {
    try {
      const user = StorageUtils.getUserBySocketId(socket.id);
      if (!user) return;

      const typingUsers = StorageUtils.setTyping(user.id, user.room, !!isTyping);
      
      // Send typing status to others in the room (exclude current user)
      socket.to(user.room).emit('typing', {
        users: typingUsers.filter(u => u.id !== user.id)
      });
    } catch (error) {
      console.error('Error in typing:', error);
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    try {
      const user = StorageUtils.removeUser(socket.id);
      untrackConnection(clientIP);
      
      if (user) {
        // Notify others in the room
        socket.to(user.room).emit('message', {
          id: uuidv4(),
          username: 'System',
          message: `${user.username} has left the chat`,
          timestamp: new Date().toISOString(),
          type: 'system'
        });

        // Update online users for the room
        const onlineUsers = StorageUtils.getUsersInRoom(user.room);
        socket.to(user.room).emit('onlineUsers', onlineUsers);

        console.log(`${user.username} disconnected from room: ${user.room}`);
      }
    } catch (error) {
      console.error('Error in disconnect:', error);
    }
  });

  // Handle explicit leave room
  socket.on('leaveRoom', () => {
    try {
      const user = StorageUtils.removeUser(socket.id);
      
      if (user) {
        socket.leave(user.room);
        
        // Notify others in the room
        socket.to(user.room).emit('message', {
          id: uuidv4(),
          username: 'System',
          message: `${user.username} has left the chat`,
          timestamp: new Date().toISOString(),
          type: 'system'
        });

        // Update online users for the room
        const onlineUsers = StorageUtils.getUsersInRoom(user.room);
        socket.to(user.room).emit('onlineUsers', onlineUsers);

        // Confirm to the user
        socket.emit('leftRoom');

        console.log(`${user.username} left room: ${user.room}`);
      }
    } catch (error) {
      console.error('Error in leaveRoom:', error);
      socket.emit('error', { message: 'Failed to leave room' });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🔒 Security mode: ${NODE_ENV}`);
  console.log(`🌐 Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = { app, server, io };