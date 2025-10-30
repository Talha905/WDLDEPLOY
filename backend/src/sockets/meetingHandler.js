const Meeting = require('../models/Meeting');

// In-memory tracking for active connections
const socketToRoom = {};
const users = {}; // roomID → [socketIDs]

module.exports = (io, socket) => {
  console.log(`Meeting handler initialized for socket: ${socket.id}`);

  // Join room handler
  socket.on('join room', async ({ roomID, userEmail, userUid, userName, userRole }) => {
    try {
      console.log(`User ${userName || userEmail} (${userRole || 'User'}) joining room ${roomID}`);
      
      // Find or create meeting
      let meeting = await Meeting.findOne({ meetingCode: roomID });
      if (!meeting) {
        meeting = new Meeting({ 
          meetingCode: roomID,
          participants: [],
          messages: []
        });
      }
      
      // Check capacity
      const activeUsers = users[roomID] || [];
      if (activeUsers.length >= 10) {
        console.log(`Room ${roomID} is full`);
        socket.emit('room full');
        return;
      }
      
      // Add to in-memory tracking
      if (!users[roomID]) users[roomID] = [];
      users[roomID].push(socket.id);
      socketToRoom[socket.id] = roomID;
      
      // Check if user already exists (rejoining)
      const existingParticipant = meeting.participants.find(p => p.email === userEmail);
      
      if (existingParticipant) {
        // Update existing participant
        existingParticipant.socketId = socket.id;
        existingParticipant.name = userName || existingParticipant.name || userEmail;
        existingParticipant.role = userRole || existingParticipant.role || 'User';
        existingParticipant.isActive = true;
        existingParticipant.leftAt = null;
      } else {
        // Add new participant
        meeting.participants.push({
          socketId: socket.id,
          email: userEmail,
          uid: userUid,
          name: userName || userEmail,
          role: userRole || 'User',
          joinedAt: new Date(),
          isActive: true
        });
      }
      
      await meeting.save();
      
      // Join socket.io room
      socket.join(roomID);
      
      // Send existing users for WebRTC
      const otherUsers = users[roomID].filter(id => id !== socket.id);
      socket.emit('all users', otherUsers);
      
      // Broadcast updated participants to all in room
      const activeParticipants = meeting.participants.filter(p => p.isActive);
      io.to(roomID).emit('participants update', activeParticipants);
      
      console.log(`Room ${roomID} now has ${otherUsers.length + 1} users`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // WebRTC signaling - sending signal
  socket.on('sending signal', (payload) => {
    console.log(`Sending signal from ${socket.id} to ${payload.userToSignal}`);
    io.to(payload.userToSignal).emit('user joined', {
      signal: payload.signal,
      callerID: payload.callerID || socket.id
    });
  });

  // WebRTC signaling - returning signal
  socket.on('returning signal', (payload) => {
    console.log(`Returning signal from ${socket.id} to ${payload.callerID}`);
    io.to(payload.callerID).emit('receiving returned signal', {
      signal: payload.signal,
      id: socket.id
    });
  });

  // Chat message handler
  socket.on('send message', async ({ meetingCode, message, senderEmail, senderUid, senderName }) => {
    try {
      console.log(`Message from ${senderEmail} in room ${meetingCode}`);
      
      const messageObj = {
        message,
        senderEmail,
        senderUid,
        senderName: senderName || senderEmail,
        sentAt: new Date()
      };
      
      // Save to MongoDB
      const meeting = await Meeting.findOneAndUpdate(
        { meetingCode },
        { $push: { messages: messageObj } },
        { new: true }
      );
      
      if (!meeting) {
        socket.emit('error', { message: 'Meeting not found' });
        return;
      }
      
      // Broadcast to room
      io.to(meetingCode).emit('new message', messageObj);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Get chat history
  socket.on('get chat history', async (meetingCode) => {
    try {
      console.log(`Fetching chat history for room ${meetingCode}`);
      const meeting = await Meeting.findOne({ meetingCode });
      
      if (meeting) {
        socket.emit('chat history', meeting.messages || []);
      } else {
        socket.emit('chat history', []);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      socket.emit('chat history', []);
    }
  });

  // Get participants
  socket.on('get participants', async (meetingCode) => {
    try {
      console.log(`Fetching participants for room ${meetingCode}`);
      const meeting = await Meeting.findOne({ meetingCode });
      
      if (meeting) {
        const activeParticipants = meeting.participants.filter(p => p.isActive);
        socket.emit('participants update', activeParticipants);
      } else {
        socket.emit('participants update', []);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      socket.emit('participants update', []);
    }
  });

  // Screen sharing handlers
  socket.on('screen share started', async ({ roomID, presenterInfo }) => {
    try {
      console.log(`Screen share started by ${presenterInfo.name} in room ${roomID}`);
      
      // Broadcast to all participants in the room
      socket.to(roomID).emit('screen share started', { presenterInfo });
      
      // Optionally store presenter info in meeting document
      const meeting = await Meeting.findOne({ meetingCode: roomID });
      if (meeting) {
        meeting.currentPresenter = {
          socketId: presenterInfo.socketId,
          name: presenterInfo.name,
          role: presenterInfo.role,
          startedAt: new Date()
        };
        await meeting.save();
      }
    } catch (error) {
      console.error('Error handling screen share start:', error);
    }
  });
  
  socket.on('screen share stopped', async ({ roomID }) => {
    try {
      console.log(`Screen share stopped in room ${roomID}`);
      
      // Broadcast to all participants in the room
      socket.to(roomID).emit('screen share stopped');
      
      // Clear presenter info from meeting document
      const meeting = await Meeting.findOne({ meetingCode: roomID });
      if (meeting) {
        meeting.currentPresenter = null;
        await meeting.save();
      }
    } catch (error) {
      console.error('Error handling screen share stop:', error);
    }
  });

  // Whiteboard data handler
  socket.on('whiteboard', (data) => {
    const roomID = socketToRoom[socket.id];
    if (roomID) {
      // Broadcast to all except sender
      socket.to(roomID).emit('whiteboard', data);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log(`Socket ${socket.id} disconnected`);
    const roomID = socketToRoom[socket.id];
    
    if (roomID) {
      try {
        // Remove from in-memory tracking
        let room = users[roomID];
        if (room) {
          room = room.filter(id => id !== socket.id);
          users[roomID] = room;
          
          // Clean up empty rooms
          if (room.length === 0) {
            delete users[roomID];
          }
        }
        
        // Update MongoDB - mark participant as inactive
        const meeting = await Meeting.findOne({ meetingCode: roomID });
        if (meeting) {
          const participant = meeting.participants.find(p => p.socketId === socket.id);
          if (participant) {
            participant.isActive = false;
            participant.leftAt = new Date();
            
            // If this was the presenter, clear presenter info and notify others
            if (meeting.currentPresenter && meeting.currentPresenter.socketId === socket.id) {
              meeting.currentPresenter = null;
              socket.to(roomID).emit('screen share stopped');
            }
            
            await meeting.save();
          }
          
          // Broadcast updated participants
          const activeParticipants = meeting.participants.filter(p => p.isActive);
          io.to(roomID).emit('participants update', activeParticipants);
        }
        
        // Notify others that user left
        socket.to(roomID).emit('user left', socket.id);
        
        console.log(`User left room ${roomID}, ${users[roomID]?.length || 0} users remaining`);
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
      
      delete socketToRoom[socket.id];
    }
  });

  // Leave room explicitly
  socket.on('leave room', async ({ roomID }) => {
    console.log(`Socket ${socket.id} leaving room ${roomID}`);
    
    try {
      // Remove from in-memory tracking
      if (users[roomID]) {
        users[roomID] = users[roomID].filter(id => id !== socket.id);
        if (users[roomID].length === 0) {
          delete users[roomID];
        }
      }
      
      // Update MongoDB
      const meeting = await Meeting.findOne({ meetingCode: roomID });
      if (meeting) {
        const participant = meeting.participants.find(p => p.socketId === socket.id);
        if (participant) {
          participant.isActive = false;
          participant.leftAt = new Date();
          
          // If this was the presenter, clear presenter info and notify others
          if (meeting.currentPresenter && meeting.currentPresenter.socketId === socket.id) {
            meeting.currentPresenter = null;
            socket.to(roomID).emit('screen share stopped');
          }
          
          await meeting.save();
        }
        
        // Broadcast updated participants
        const activeParticipants = meeting.participants.filter(p => p.isActive);
        io.to(roomID).emit('participants update', activeParticipants);
      }
      
      // Leave socket.io room
      socket.leave(roomID);
      socket.to(roomID).emit('user left', socket.id);
      
      delete socketToRoom[socket.id];
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });
};