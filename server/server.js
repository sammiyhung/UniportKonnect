// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const server = http.createServer(app);

// Retrieve FRONTEND_URL from environment variables, default to localhost for development
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize Socket.io with enhanced CORS settings
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL, // Allow only your frontend URL
    methods: ['GET', 'POST'],
    credentials: true, // Allow credentials if needed
  },
  // Additional Socket.io configurations can be added here
});

// In-memory user storage (consider using a database for scalability)
const users = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user joining a chat
  socket.on('join', (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} joined with socket ID ${socket.id}`);
  });

  // Handle sending messages
  socket.on('sendMessage', ({ senderId, receiverId, message }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', {
        senderId,
        message,
        timestamp: new Date(),
      });
      console.log(`Message from ${senderId} to ${receiverId}: ${message}`);
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing', { senderId });
      console.log(`User ${senderId} is typing to ${receiverId}`);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from users object
    for (const [userId, socketId] of Object.entries(users)) {
      if (socketId === socket.id) {
        delete users[userId];
        console.log(`User ${userId} removed from active users.`);
        break;
      }
    }
  });
});

// Health check route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});