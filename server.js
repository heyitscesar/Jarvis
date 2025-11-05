
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors()); // Allow cross-origin requests

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity
    methods: ["GET", "POST"]
  }
});

const PORT = 4001;

// Store the last known brightness value
let currentBrightness = 3;

io.on('connection', (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // Send the current brightness to the newly connected client
  socket.emit('brightnessUpdate', currentBrightness);

  // Listen for brightness changes from a client
  socket.on('brightnessChange', (newValue) => {
    currentBrightness = newValue;
    // Broadcast the new brightness to all OTHER clients
    socket.broadcast.emit('brightnessUpdate', currentBrightness);
    console.log(`Brightness updated to ${newValue} by ${socket.id}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
