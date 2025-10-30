const chatHandlers = require('../sockets/chatEnhanced');
const signalingHandlers = require('../sockets/signaling');
const meetingHandlers = require('../sockets/meetingHandler');

function initSockets(io) {
  console.log('Socket.IO initialized');
  
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    console.log(`Auth data:`, socket.handshake.auth);
    
    // Initialize handlers
    try {
      chatHandlers(io, socket);
      console.log(`Chat handlers initialized for ${socket.id}`);
    } catch (err) {
      console.error(`Error initializing chat handlers for ${socket.id}:`, err);
    }
    
    try {
      signalingHandlers(io, socket);
      console.log(`Signaling handlers initialized for ${socket.id}`);
    } catch (err) {
      console.error(`Error initializing signaling handlers for ${socket.id}:`, err);
    }
    
    try {
      meetingHandlers(io, socket);
      console.log(`Meeting handlers initialized for ${socket.id}`);
    } catch (err) {
      console.error(`Error initializing meeting handlers for ${socket.id}:`, err);
    }
    
    socket.on('disconnect', (reason) => {
      console.log(`Socket ${socket.id} disconnected: ${reason}`);
    });
    
    socket.on('error', (error) => {
      console.error(`Socket ${socket.id} error:`, error);
    });
  });
}

module.exports = { initSockets };
