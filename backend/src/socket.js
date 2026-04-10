const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    // Join personal room to receive notifications
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
    });

    // Join a booking room to send/receive chat messages in real time
    // Both client and provider call this after opening the chat screen
    socket.on('join:booking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
    });

    socket.on('leave:booking', (bookingId) => {
      socket.leave(`booking_${bookingId}`);
    });

    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
