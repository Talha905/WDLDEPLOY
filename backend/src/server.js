const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { initSockets } = require('./utils/socket');
const { loadEnv } = require('./config/env');

loadEnv();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6,
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

initSockets(io);

server.listen(PORT, () => {
  console.log(`MentorHub backend listening on port ${PORT}`);
});
