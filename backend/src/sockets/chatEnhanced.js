const ChatMessage = require('../models/ChatMessage');
const Session = require('../models/Session');
const User = require('../models/User');

module.exports = (io, socket) => {
  console.log(`Chat handler initialized for socket: ${socket.id}`);

  // Join a session room for in-session chat
  socket.on('chat:join', async ({ sessionId, userId }) => {
    try {
      if (!sessionId || !userId) {
        console.error('Invalid chat join parameters');
        return;
      }
      
      // Try to load session and user, but allow chat join even if not a participant
      let user = null;
      try {
        user = await User.findById(userId).select('name avatarUrl');
      } catch (e) {
        // ignore lookup failures; we'll still allow join for local testing
      }

      socket.join(`session:${sessionId}`);
      socket.sessionId = sessionId;
      socket.userId = userId;
      socket.chatUserData = user || { name: `User-${String(userId).slice(-4)}` };
      
      console.log(`User ${socket.chatUserData.name} joined chat for session ${sessionId}`);
      
      socket.to(`session:${sessionId}`).emit('chat:user-joined', { 
        userId: userId, 
        name: socket.chatUserData.name,
        avatarUrl: user?.avatarUrl 
      });

      // Send recent history after join (best-effort)
      try {
        const messages = await ChatMessage.find({ session: sessionId })
          .populate('sender', 'name avatarUrl')
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();
        socket.emit('chat:history', { sessionId, messages: messages.reverse() });
      } catch (e) {
        // ignore if DB not available
      }
    } catch (err) {
      console.error('Chat join error:', err);
      socket.emit('chat:error', { message: 'Failed to join chat' });
    }
  });

  // CHAT FIX: Real-time chat message handler for video calls
  // This was enhanced to ensure reliable message delivery and display
  socket.on('chat:send-message', async ({ sessionId, message, timestamp }) => {
    try {
      if (!sessionId || !message) {
        console.error('Invalid message parameters', { sessionId, hasMessage: !!message, userId: socket.userId });
        return;
      }

      // Ensure we have a user identity for the sender
      if (!socket.userId) {
        socket.userId = socket.handshake?.auth?.userId || socket.id;
      }
      const senderName = socket.chatUserData?.name || `User-${String(socket.userId).toString().slice(-4)}`;

      const messageText = String(message).trim();
      if (!messageText) return;

      // Build message payload (keep both fields for compatibility)
      const chatMessage = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        content: messageText,
        message: messageText,
        senderId: socket.userId,
        senderName,
        timestamp: timestamp || new Date().toISOString(),
        isTemporary: true
      };

      // Broadcast to everyone in the room
      io.to(`session:${sessionId}`).emit('chat:new-message', chatMessage);
      // Ensure the sender also sees their message even if they didn't join the room
      socket.emit('chat:new-message', chatMessage);

      // Best-effort persistence
      try {
        const dbMessage = await ChatMessage.create({
          session: sessionId,
          sender: socket.userId,
          message: messageText,
          messageType: 'text'
        });
        socket.emit('chat:message-saved', { tempId: chatMessage.id, dbId: dbMessage._id });
      } catch (dbError) {
        // Log but don't fail the real-time path
        console.error('Database save error (message still delivered):', dbError);
      }
    } catch (err) {
      console.error('Chat message error:', err);
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  // Legacy message handler for backward compatibility
  socket.on('chat:message', async ({ sessionId, message }) => {
    try {
      if (!sessionId || !message || !socket.userId) return;

      // Save message to database
      const chatMessage = await ChatMessage.create({
        session: sessionId,
        sender: socket.userId,
        message: message.trim(),
        messageType: 'text'
      });

      const populated = await ChatMessage.findById(chatMessage._id)
        .populate('sender', 'name avatarUrl');

      io.to(`session:${sessionId}`).emit('chat:message', {
        id: populated._id,
        message: populated.message,
        sender: populated.sender,
        timestamp: populated.timestamp
      });
    } catch (err) {
      console.error('Legacy chat message error:', err);
    }
  });

  // Get chat history
  socket.on('chat:get-history', async ({ sessionId, limit = 50 }) => {
    try {
      if (!sessionId || !socket.userId) {
        console.error('Invalid chat history request');
        return;
      }

      const messages = await ChatMessage.find({ session: sessionId })
        .populate('sender', 'name avatarUrl')
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();

      socket.emit('chat:history', {
        sessionId: sessionId,
        messages: messages.reverse() // Reverse to get chronological order
      });
    } catch (err) {
      console.error('Chat history error:', err);
      socket.emit('chat:error', { message: 'Failed to load chat history' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', ({ sessionId, isTyping }) => {
    if (!sessionId || !socket.chatUserData) return;
    
    socket.to(`session:${sessionId}`).emit('chat:user-typing', {
      userId: socket.userId,
      name: socket.chatUserData.name,
      isTyping: isTyping
    });
  });

  // Leave chat
  socket.on('chat:leave', ({ sessionId }) => {
    if (!sessionId) return;
    
    console.log(`User leaving chat for session ${sessionId}`);
    socket.leave(`session:${sessionId}`);
    socket.to(`session:${sessionId}`).emit('chat:user-left', { 
      userId: socket.userId,
      name: socket.chatUserData?.name
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Chat user disconnected: ${socket.id}`);
    if (socket.sessionId) {
      socket.to(`session:${socket.sessionId}`).emit('chat:user-left', { 
        userId: socket.userId,
        name: socket.chatUserData?.name
      });
    }
  });
};
