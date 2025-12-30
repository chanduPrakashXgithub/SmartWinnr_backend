const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom');
const { parsePagination, createPaginationMeta } = require('../utils');
const { asyncHandler, NotFoundError, ForbiddenError, BadRequestError } = require('../middleware');
const { getFileUrl } = require('../middleware/upload');

/**
 * @desc    Get messages for a chat room
 * @route   GET /api/messages/:roomId
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { before } = req.query;
    const { page, limit } = parsePagination(req.query);

    // Verify chat room exists and user has access
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
        throw new NotFoundError('Chat room not found');
    }

    if (!chatRoom.isParticipant(req.userId)) {
        throw new ForbiddenError('You are not a member of this chat room');
    }

    // Get messages
    const messages = await Message.getMessages(roomId, { page, limit, before });

    // Get total count for pagination
    const total = await Message.countDocuments({
        chatRoom: roomId,
        isDeleted: false,
    });

    // Update last read
    chatRoom.updateLastRead(req.userId);
    await chatRoom.save();

    res.json({
        success: true,
        data: {
            messages,
            pagination: createPaginationMeta(total, page, limit),
        },
    });
});

/**
 * @desc    Send a message (REST endpoint - fallback for socket)
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
    const { chatRoomId, content, replyTo } = req.body;

    // Verify chat room exists and user has access
    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
        throw new NotFoundError('Chat room not found');
    }

    if (!chatRoom.isParticipant(req.userId)) {
        throw new ForbiddenError('You are not a member of this chat room');
    }

    // Create message
    const message = await Message.create({
        chatRoom: chatRoomId,
        sender: req.userId,
        content,
        messageType: 'text',
        ...(replyTo && { replyTo }),
    });

    // Update chat room's last message
    chatRoom.lastMessage = message._id;
    await chatRoom.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');

    res.status(201).json({
        success: true,
        data: { message },
    });
});

/**
 * @desc    Send a message with media attachment
 * @route   POST /api/messages/media
 * @access  Private
 */
const sendMediaMessage = asyncHandler(async (req, res) => {
    const { chatRoomId, content } = req.body;

    if (!req.file) {
        throw new BadRequestError('Please upload a file');
    }

    // Verify chat room exists and user has access
    const chatRoom = await ChatRoom.findById(chatRoomId);

    if (!chatRoom) {
        throw new NotFoundError('Chat room not found');
    }

    if (!chatRoom.isParticipant(req.userId)) {
        throw new ForbiddenError('You are not a member of this chat room');
    }

    // Determine message type
    const isImage = req.file.mimetype.startsWith('image/');
    const messageType = isImage ? 'image' : 'file';

    // Get file URL
    const fileUrl = getFileUrl(req.file);

    // Create message with media
    const message = await Message.create({
        chatRoom: chatRoomId,
        sender: req.userId,
        content: content || '',
        messageType,
        media: {
            url: fileUrl,
            filename: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
        },
    });

    // Update chat room's last message
    chatRoom.lastMessage = message._id;
    await chatRoom.save();

    // Populate sender info
    await message.populate('sender', 'username avatar');

    res.status(201).json({
        success: true,
        data: { message },
    });
});

/**
 * @desc    Edit a message
 * @route   PUT /api/messages/:messageId
 * @access  Private (Message owner only)
 */
const editMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
        throw new NotFoundError('Message not found');
    }

    if (message.sender.toString() !== req.userId.toString()) {
        throw new ForbiddenError('You can only edit your own messages');
    }

    if (message.isDeleted) {
        throw new BadRequestError('Cannot edit deleted message');
    }

    // Check if message has media - can only edit content
    message.editContent(content);
    await message.save();

    await message.populate('sender', 'username avatar');

    res.json({
        success: true,
        message: 'Message edited successfully',
        data: { message },
    });
});

/**
 * @desc    Delete a message
 * @route   DELETE /api/messages/:messageId
 * @access  Private (Message owner only)
 */
const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
        throw new NotFoundError('Message not found');
    }

    if (message.sender.toString() !== req.userId.toString()) {
        throw new ForbiddenError('You can only delete your own messages');
    }

    // Soft delete
    message.softDelete();
    await message.save();

    res.json({
        success: true,
        message: 'Message deleted successfully',
    });
});

/**
 * @desc    Mark message as read
 * @route   POST /api/messages/:messageId/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
        throw new NotFoundError('Message not found');
    }

    // Verify user has access to the chat room
    const chatRoom = await ChatRoom.findById(message.chatRoom);

    if (!chatRoom || !chatRoom.isParticipant(req.userId)) {
        throw new ForbiddenError('Access denied');
    }

    message.markAsRead(req.userId);
    await message.save();

    res.json({
        success: true,
        message: 'Message marked as read',
    });
});

/**
 * @desc    Get unread message count
 * @route   GET /api/messages/unread/count
 * @access  Private
 */
const getUnreadCount = asyncHandler(async (req, res) => {
    // Get all chat rooms for user
    const chatRooms = await ChatRoom.find({
        'participants.user': req.userId,
        isActive: true,
    });

    let totalUnread = 0;
    const roomUnread = {};

    for (const room of chatRooms) {
        const participant = room.participants.find(
            (p) => p.user.toString() === req.userId.toString()
        );

        const unreadCount = await Message.countDocuments({
            chatRoom: room._id,
            createdAt: { $gt: participant?.lastRead || new Date(0) },
            sender: { $ne: req.userId },
            isDeleted: false,
        });

        if (unreadCount > 0) {
            roomUnread[room._id] = unreadCount;
            totalUnread += unreadCount;
        }
    }

    res.json({
        success: true,
        data: {
            totalUnread,
            roomUnread,
        },
    });
});

module.exports = {
    getMessages,
    sendMessage,
    sendMediaMessage,
    editMessage,
    deleteMessage,
    markAsRead,
    getUnreadCount,
};
