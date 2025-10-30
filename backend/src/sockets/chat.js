module.exports = (io, socket) => {
  // Join a session room for in-session chat
  socket.on('chat:join', ({ sessionId, user }) => {
    if (!sessionId) return;
    socket.join(`session:${sessionId}`);
    socket.to(`session:${sessionId}`).emit('chat:user-joined', { userId: user?.id, name: user?.name });
  });

  socket.on('chat:message', ({ sessionId, message }) => {
    if (!sessionId || !message) return;
    io.to(`session:${sessionId}`).emit('chat:message', { ...message, ts: Date.now() });
  });

  socket.on('chat:leave', ({ sessionId, user }) => {
    if (!sessionId) return;
    socket.leave(`session:${sessionId}`);
    socket.to(`session:${sessionId}`).emit('chat:user-left', { userId: user?.id, name: user?.name });
  });
};
