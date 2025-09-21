/**
 * Real-Time Chat Server
 * Express + Socket.io implementation with in-memory storage
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS for frontend connection
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // Vite dev server default port
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware setup
app.use(cors());
app.use(express.json());

// In-memory storage structures
const storage = {
  users: new Map(),        // userId -> { id, username, room, socketId }
  rooms: new Map(),        // roomName -> { users: Set(), messages: [] }
  sockets: new Map(),      // socketId -> userId
  typingUsers: new Map()   // roomName -> Set(userIds)
};

// Utility functions for storage management
const StorageUtils = {
  // Add user to storage
  addUser: (userId, username, room, socketId) => {
    const user = { id: userId, username, room, socketId };
    storage.users.set(userId, user);
    storage.sockets.set(socketId, userId);
    
    // Initialize room if it doesn't exist
    if (!storage.rooms.has(room)) {
      storage.rooms.set(room, { users: new Set(), messages: [] });
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

  // Add message to room
  addMessage: (roomName, message) => {
    const room = storage.rooms.get(roomName);
    if (room) {
      room.messages.push(message);
      // Keep only last 100 messages to prevent memory issues
      if (room.messages.length > 100) {
        room.messages = room.messages.slice(-100);
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

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Real-time chat server is running',
    stats: {
      totalUsers: storage.users.size,
      totalRooms: storage.rooms.size,
      connectedSockets: storage.sockets.size
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Handle user joining a room
  socket.on('joinRoom', ({ username, room }) => {
    try {
      // Validate input
      if (!username || !room) {
        socket.emit('error', { message: 'Username and room are required' });
        return;
      }

      const userId = uuidv4();
      const user = StorageUtils.addUser(userId, username.trim(), room.trim(), socket.id);

      // Join the socket room
      socket.join(room);

      // Send welcome message to user
      socket.emit('message', {
        id: uuidv4(),
        username: 'System',
        message: `Welcome to ${room}, ${username}!`,
        timestamp: new Date().toISOString(),
        type: 'system'
      });

      // Notify others in the room
      socket.to(room).emit('message', {
        id: uuidv4(),
        username: 'System',
        message: `${username} has joined the chat`,
        timestamp: new Date().toISOString(),
        type: 'system'
      });

      // Send room history to the new user
      const roomMessages = StorageUtils.getRoomMessages(room);
      socket.emit('roomHistory', roomMessages);

      // Update online users for the room
      const onlineUsers = StorageUtils.getUsersInRoom(room);
      io.to(room).emit('onlineUsers', onlineUsers);

      console.log(`${username} joined room: ${room}`);
    } catch (error) {
      console.error('Error in joinRoom:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle sending messages
  socket.on('sendMessage', ({ message }) => {
    try {
      const user = StorageUtils.getUserBySocketId(socket.id);
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      if (!message || message.trim() === '') {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      const messageObj = {
        id: uuidv4(),
        username: user.username,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        type: 'user'
      };

      // Store message
      StorageUtils.addMessage(user.room, messageObj);

      // Broadcast message to room
      io.to(user.room).emit('message', messageObj);

      console.log(`Message from ${user.username} in ${user.room}: ${message}`);
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

      const typingUsers = StorageUtils.setTyping(user.id, user.room, isTyping);
      
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
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
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