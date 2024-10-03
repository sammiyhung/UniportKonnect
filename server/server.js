// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

// Appwrite SDK
const { Client, Databases, ID } = require('appwrite');

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://uniportkonnect.onrender.com', // Restrict to your frontend URL
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT) // Your Appwrite Endpoint
  .setProject(process.env.APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// In-memory user storage (Consider using Redis for scalability)
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
  socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
    const receiverSocketId = users[receiverId];
    const timestamp = new Date();

    // Emit the message to the receiver in real-time
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receiveMessage', {
        senderId,
        message,
        timestamp,
      });
      console.log(`Real-time message from ${senderId} to ${receiverId}: ${message}`);
    }

    // Store the message in Appwrite
    try {
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID, // Your Appwrite Database ID
        process.env.APPWRITE_COLLECTION_ID, // Your Appwrite Collection ID (e.g., 'messages')
        ID.unique(), // Auto-generated ID
        {
          senderId,
          receiverId,
          message,
          timestamp: timestamp.toISOString(),
        }
      );
      console.log('Message stored in Appwrite');
    } catch (error) {
      console.error('Error storing message in Appwrite:', error);
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
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
