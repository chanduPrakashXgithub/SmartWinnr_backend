const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');

/**
 * Chat event handlers for Socket.IO
 */

/**
 * Handle sending a new message
 * @param {Socket} socket - Socket instance
 * @param {object} data - Message data
 * @returns {Promise<Message>}
 */
const handleSendMessage = async (socket, data) => {
    const { chatRoomId, content, replyTo } = data;
    const userId = socket.userId;

    // Validate chat room and user access
    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
        throw new Error('Chat room not found');
    }

    if (!chatRoom.isParticipant(userId)) {
        throw new Error('You are not a member of this chat room');
    }

    // Create message
    const message = await Message.create({
        chatRoom: chatRoomId,
        sender: userId,
        content,
        messageType: 'text',
        ...(replyTo && { replyTo }),
    });

    // Update chat room's last message
    chatRoom.lastMessage = message._id;
    await chatRoom.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');

    return message;
};

/**
 * Handle editing a message
 * @param {Socket} socket - Socket instance
 * @param {object} data - Edit data
 * @returns {Promise<Message>}
 */
const handleEditMessage = async (socket, data) => {
    const { messageId, content } = data;
    const userId = socket.userId;

    const message = await Message.findById(messageId);

    if (!message) {
        throw new Error('Message not found');
    }

    if (message.sender.toString() !== userId.toString()) {
        throw new Error('You can only edit your own messages');
    }

    if (message.isDeleted) {
        throw new Error('Cannot edit deleted message');
    }

    message.editContent(content);
    await message.save();

    await message.populate('sender', 'username avatar');

    return message;
};

/**
 * Handle deleting a message
 * @param {Socket} socket - Socket instance
 * @param {object} data - Delete data
 * @returns {Promise<object>}
 */
const handleDeleteMessage = async (socket, data) => {
    const { messageId } = data;
    const userId = socket.userId;

    const message = await Message.findById(messageId);

    if (!message) {
        throw new Error('Message not found');
    }

    if (message.sender.toString() !== userId.toString()) {
        throw new Error('You can only delete your own messages');
    }

    const chatRoomId = message.chatRoom;

    message.softDelete();
    await message.save();

    return { messageId, chatRoomId };
};

/**
 * Handle marking messages as read
 * @param {Socket} socket - Socket instance
 * @param {object} data - Read data
 */
const handleMarkAsRead = async (socket, data) => {
    const { chatRoomId } = data;
    const userId = socket.userId;

    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
        throw new Error('Chat room not found');
    }

    if (!chatRoom.isParticipant(userId)) {
        throw new Error('You are not a member of this chat room');
    }

    chatRoom.updateLastRead(userId);
    await chatRoom.save();
};

/**
 * Notify room participants about new message
 * @param {Server} io - Socket.IO server
 * @param {Map} userSockets - User sockets map
 * @param {string} chatRoomId - Chat room ID
 * @param {Message} message - New message
 */
const notifyParticipants = async (io, userSockets, chatRoomId, message) => {
    try {
        const chatRoom = await ChatRoom.findById(chatRoomId);

        if (!chatRoom) return;

        // Notify each participant who might not be in the room
        for (const participant of chatRoom.participants) {
            const participantId = participant.user.toString();
            const senderId = message.sender._id.toString();

            // Don't notify the sender
            if (participantId === senderId) continue;

            // Send notification to user's personal room
            io.to(`user:${participantId}`).emit('notification:message', {
                chatRoomId,
                message: {
                    _id: message._id,
                    content: message.content,
                    sender: message.sender,
                    createdAt: message.createdAt,
                },
            });
        }
    } catch (error) {
        console.error('Error notifying participants:', error);
    }
};

module.exports = {
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage,
    handleMarkAsRead,
    notifyParticipants,
};
