// Enhanced WebRTC signaling server for local peer-to-peer video calls
// Supports up to 6 users in a room with proper connection management
//
// KEY FIXES APPLIED:
// 1. Enhanced room state management to track all users properly
// 2. Automatic peer connection initiation between existing and new users  
// 3. Comprehensive logging for debugging connection issues
// 4. Proper cleanup of rooms when users leave

const activeRooms = new Map(); // Track active rooms and participants

module.exports = (io, socket) => {
  console.log(`New socket connected: ${socket.id}`);

  // Join WebRTC room
  socket.on('webrtc:join-room', ({ roomId, userData }) => {
    try {
      console.log(`Join room request - roomId: ${roomId}, userData:`, userData);
      if (!roomId || !userData) {
        console.error('Invalid room ID or user data', { roomId, userData });
        socket.emit('webrtc:error', { message: 'Invalid room ID or user data' });
        return;
      }

      // Initialize room if it doesn't exist
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Map());
      }

      const room = activeRooms.get(roomId);
      
      // Check room capacity (max 6 users)
      if (room.size >= 6) {
        socket.emit('webrtc:error', { message: 'Room is full (maximum 6 participants)' });
        return;
      }

      // Add user to room
      room.set(socket.id, {
        socketId: socket.id,
        userId: userData.userId,
        name: userData.name,
        joinedAt: Date.now()
      });

      socket.join(roomId);
      socket.currentRoom = roomId;
      socket.userData = userData;

      console.log(`User ${userData.name} joined room ${roomId}`);
      console.log(`Room ${roomId} now has ${room.size} users:`, Array.from(room.values()).map(u => u.name));

      // Notify existing users about new participant
      const allUsers = Array.from(room.values());
      console.log(`Notifying existing users in room ${roomId} about ${userData.name}`);
      socket.to(roomId).emit('webrtc:user-joined', {
        socketId: socket.id,
        userData: userData,
        roomUsers: allUsers
      });

      // MULTI-USER VIDEO FIX: Send current room participants to the new user
      // This ensures the new user knows about all existing participants
      const existingUsers = Array.from(room.values()).filter(user => user.socketId !== socket.id);
      console.log(`Sending existing users to ${userData.name}:`, existingUsers.map(u => u.name));
      
      socket.emit('webrtc:room-joined', {
        roomId: roomId,
        existingUsers: existingUsers,
        totalUsers: room.size
      });
      
      // Important: Only the NEW user will initiate offers to existing users.
      // Existing users will wait for offers to avoid glare (simultaneous offers).
      // No extra event needed here.

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('webrtc:error', { message: 'Failed to join room' });
    }
  });

  // Handle WebRTC offer
  socket.on('webrtc:offer', ({ roomId, targetSocketId, offer }) => {
    try {
      if (!roomId || !targetSocketId || !offer) {
        console.error('Invalid offer parameters');
        return;
      }

      console.log(`Forwarding offer from ${socket.id} to ${targetSocketId}`);
      
      socket.to(targetSocketId).emit('webrtc:offer', {
        fromSocketId: socket.id,
        fromUserData: socket.userData,
        offer: offer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  });

  // Handle WebRTC answer
  socket.on('webrtc:answer', ({ roomId, targetSocketId, answer }) => {
    try {
      if (!roomId || !targetSocketId || !answer) {
        console.error('Invalid answer parameters');
        return;
      }

      console.log(`Forwarding answer from ${socket.id} to ${targetSocketId}`);
      
      socket.to(targetSocketId).emit('webrtc:answer', {
        fromSocketId: socket.id,
        fromUserData: socket.userData,
        answer: answer
      });
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  });

  // Handle ICE candidate
  socket.on('webrtc:ice-candidate', ({ roomId, targetSocketId, candidate }) => {
    try {
      if (!roomId || !targetSocketId || !candidate) {
        console.error('Invalid ICE candidate parameters');
        return;
      }

      socket.to(targetSocketId).emit('webrtc:ice-candidate', {
        fromSocketId: socket.id,
        fromUserData: socket.userData,
        candidate: candidate
      });
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  });

  // Handle user leaving room
  socket.on('webrtc:leave-room', ({ roomId }) => {
    handleUserLeave(socket, roomId);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.currentRoom) {
      handleUserLeave(socket, socket.currentRoom);
    }
  });

  // Helper function to handle user leaving
  function handleUserLeave(socket, roomId) {
    try {
      if (!roomId) return;

      const room = activeRooms.get(roomId);
      if (room && room.has(socket.id)) {
        const userData = room.get(socket.id);
        room.delete(socket.id);

        console.log(`User ${userData.name} left room ${roomId}`);

        // Notify other users
        socket.to(roomId).emit('webrtc:user-left', {
          socketId: socket.id,
          userData: userData,
          remainingUsers: room.size
        });

        socket.leave(roomId);

        // Clean up empty rooms
        if (room.size === 0) {
          activeRooms.delete(roomId);
          console.log(`Room ${roomId} cleaned up`);
        }
      }
    } catch (error) {
      console.error('Error handling user leave:', error);
    }
  }

  // Get room info
  socket.on('webrtc:get-room-info', ({ roomId }) => {
    try {
      const room = activeRooms.get(roomId);
      socket.emit('webrtc:room-info', {
        roomId: roomId,
        userCount: room ? room.size : 0,
        users: room ? Array.from(room.values()) : []
      });
    } catch (error) {
      console.error('Error getting room info:', error);
      socket.emit('webrtc:error', { message: 'Failed to get room info' });
    }
  });
};
