const { socketAuth } = require('../middleware/auth');
const chatHandler = require('./chatHandler');
const User = require('../models/User');

/**
 * Online users store
 * Maps socketId -> userId and userId -> socketId(s)
 */
const onlineUsers = new Map();
const userSockets = new Map(); // userId -> Set of socketIds (for multiple tabs)

/**
 * Initialize Socket.IO with the HTTP server
 * @param {Server} io - Socket.IO server instance
 */
const initializeSocket = (io) => {
    // Apply authentication middleware
    io.use(socketAuth);

    io.on('connection', async (socket) => {
        const userId = socket.userId;
        const username = socket.user.username;

        console.log(`🔌 User connected: ${username} (${socket.id})`);

        // Track online user
        onlineUsers.set(socket.id, userId);

        // Handle multiple tabs/devices
        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        // Update user status to online
        await User.findByIdAndUpdate(userId, { status: 'online' });

        // Join user's personal room (for private notifications)
        socket.join(`user:${userId}`);

        // Broadcast online status to all users
        socket.broadcast.emit('user:online', {
            userId,
            username,
        });

        // Send current online users list
        const onlineUserIds = [...new Set([...userSockets.keys()])];
        socket.emit('users:online', onlineUserIds);

        // ============================================
        // Chat Room Events
        // ============================================

        /**
         * Join a chat room
         */
        socket.on('room:join', (roomId) => {
            socket.join(`room:${roomId}`);
            console.log(`👤 ${username} joined room: ${roomId}`);
        });

        /**
         * Leave a chat room
         */
        socket.on('room:leave', (roomId) => {
            socket.leave(`room:${roomId}`);
            console.log(`👤 ${username} left room: ${roomId}`);
        });

        // ============================================
        // Message Events
        // ============================================

        /**
         * Handle sending a message
         */
        socket.on('message:send', async (data) => {
            try {
                const message = await chatHandler.handleSendMessage(socket, data);

                // Emit to room members
                io.to(`room:${data.chatRoomId}`).emit('message:new', message);

                // Notify room participants who are not in the room
                chatHandler.notifyParticipants(io, userSockets, data.chatRoomId, message);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        /**
         * Handle message edit
         */
        socket.on('message:edit', async (data) => {
            try {
                const message = await chatHandler.handleEditMessage(socket, data);
                io.to(`room:${message.chatRoom}`).emit('message:edited', message);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        /**
         * Handle message delete
         */
        socket.on('message:delete', async (data) => {
            try {
                const result = await chatHandler.handleDeleteMessage(socket, data);
                io.to(`room:${result.chatRoomId}`).emit('message:deleted', result);
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // ============================================
        // Typing Events
        // ============================================

        /**
         * User started typing
         */
        socket.on('typing:start', (data) => {
            socket.to(`room:${data.chatRoomId}`).emit('typing:start', {
                userId,
                username,
                chatRoomId: data.chatRoomId,
            });
        });

        /**
         * User stopped typing
         */
        socket.on('typing:stop', (data) => {
            socket.to(`room:${data.chatRoomId}`).emit('typing:stop', {
                userId,
                chatRoomId: data.chatRoomId,
            });
        });

        // ============================================
        // Read Receipts
        // ============================================

        /**
         * Mark messages as read
         */
        socket.on('messages:read', async (data) => {
            try {
                await chatHandler.handleMarkAsRead(socket, data);
                socket.to(`room:${data.chatRoomId}`).emit('messages:read', {
                    userId,
                    chatRoomId: data.chatRoomId,
                });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        // ============================================
        // Disconnect Handler
        // ============================================

        socket.on('disconnect', async () => {
            console.log(`🔌 User disconnected: ${username} (${socket.id})`);

            // Remove from tracking
            onlineUsers.delete(socket.id);

            const userSocketSet = userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(socket.id);

                // Only mark as offline if no other sockets for this user
                if (userSocketSet.size === 0) {
                    userSockets.delete(userId);

                    // Update user status to offline
                    await User.findByIdAndUpdate(userId, {
                        status: 'offline',
                        lastSeen: new Date(),
                    });

                    // Broadcast offline status
                    socket.broadcast.emit('user:offline', {
                        userId,
                        lastSeen: new Date(),
                    });
                }
            }
        });

        // ============================================
        // Error Handler
        // ============================================

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    // Export helpers for external use
    io.getOnlineUsers = () => [...new Set([...userSockets.keys()])];
    io.isUserOnline = (userId) => userSockets.has(userId);
    io.getUserSockets = (userId) => userSockets.get(userId) || new Set();

    return io;
};

module.exports = {
    initializeSocket,
    onlineUsers,
    userSockets,
};
