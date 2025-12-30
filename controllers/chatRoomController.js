const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const { parsePagination, createPaginationMeta } = require('../utils');
const { asyncHandler, NotFoundError, ForbiddenError, BadRequestError } = require('../middleware');

/**
 * @desc    Get all chat rooms for current user
 * @route   GET /api/chatrooms
 * @access  Private
 */
const getChatRooms = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);

    const query = {
        'participants.user': req.userId,
        isActive: true,
    };

    const [chatRooms, total] = await Promise.all([
        ChatRoom.find(query)
            .populate('participants.user', 'username avatar status lastSeen')
            .populate('lastMessage')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'sender',
                    select: 'username',
                },
            })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ChatRoom.countDocuments(query),
    ]);

    // Add unread count for each room
    const roomsWithUnread = await Promise.all(
        chatRooms.map(async (room) => {
            const participant = room.participants.find(
                (p) => p.user._id.toString() === req.userId.toString()
            );

            const unreadCount = await Message.countDocuments({
                chatRoom: room._id,
                createdAt: { $gt: participant?.lastRead || new Date(0) },
                sender: { $ne: req.userId },
                isDeleted: false,
            });

            return { ...room, unreadCount };
        })
    );

    res.json({
        success: true,
        data: {
            chatRooms: roomsWithUnread,
            pagination: createPaginationMeta(total, page, limit),
        },
    });
});

/**
 * @desc    Get a single chat room by ID
 * @route   GET /api/chatrooms/:roomId
 * @access  Private
 */
const getChatRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId)
        .populate('participants.user', 'username avatar status lastSeen')
        .populate('creator', 'username');

    if (!chatRoom) {
        throw new NotFoundError('Chat room not found');
    }

    // Check if user is a participant
    if (!chatRoom.isParticipant(req.userId)) {
        throw new ForbiddenError('You are not a member of this chat room');
    }

    res.json({
        success: true,
        data: { chatRoom },
    });
});

/**
 * @desc    Create or get private chat
 * @route   POST /api/chatrooms/private
 * @access  Private
 */
const createPrivateChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (userId === req.userId.toString()) {
        throw new BadRequestError('Cannot create chat with yourself');
    }

    const chatRoom = await ChatRoom.findOrCreatePrivateChat(req.userId, userId);

    await chatRoom.populate('participants.user', 'username avatar status lastSeen');

    res.status(201).json({
        success: true,
        data: { chatRoom },
    });
});

/**
 * @desc    Create a group chat room
 * @route   POST /api/chatrooms/group
 * @access  Private
 */
const createGroupChat = asyncHandler(async (req, res) => {
    const { name, description, participants = [] } = req.body;

    // Add creator to participants with admin role
    const participantsList = [
        { user: req.userId, role: 'admin' },
        ...participants
            .filter((id) => id !== req.userId.toString())
            .map((id) => ({ user: id, role: 'member' })),
    ];

    const chatRoom = await ChatRoom.create({
        name,
        description,
        type: 'group',
        participants: participantsList,
        creator: req.userId,
    });

    await chatRoom.populate('participants.user', 'username avatar status lastSeen');

    res.status(201).json({
        success: true,
        message: 'Group created successfully',
        data: { chatRoom },
    });
});

/**
 * @desc    Update group chat room
 * @route   PUT /api/chatrooms/:roomId
 * @access  Private (Admin only)
 */
const updateChatRoom = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { name, description, avatar } = req.body;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
        throw new NotFoundError('Chat room not found');
    }

    if (chatRoom.type !== 'group') {
        throw new BadRequestError('Cannot update private chat');
    }

    if (!chatRoom.isAdmin(req.userId)) {
        throw new ForbiddenError('Only admins can update the group');
    }

    // Update fields
    if (name) chatRoom.name = name;
    if (description !== undefined) chatRoom.description = description;
    if (avatar) chatRoom.avatar = avatar;

    await chatRoom.save();
    await chatRoom.populate('participants.user', 'username avatar status lastSeen');

    res.json({
        success: true,
        message: 'Group updated successfully',
        data: { chatRoom },
    });
});

/**
 * @desc    Add participant to group
 * @route   POST /api/chatrooms/:roomId/participants
 * @access  Private (Admin only)
 */
const addParticipant = asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
        throw new NotFoundError('Chat room not found');
    }

    if (chatRoom.type !== 'group') {
        throw new BadRequestError('Cannot add participants to private chat');
    }

    if (!chatRoom.isAdmin(req.userId)) {
        throw new ForbiddenError('Only admins can add participants');
    }

    if (chatRoom.isParticipant(userId)) {
        throw new BadRequestError('User is already a participant');
    }

    chatRoom.addParticipant(userId);
    await chatRoom.save();
    await chatRoom.populate('participants.user', 'username avatar status lastSeen');

    res.json({
        success: true,
        message: 'Participant added successfully',
        data: { chatRoom },
    });
});

/**
 * @desc    Remove participant from group
 * @route   DELETE /api/chatrooms/:roomId/participants/:userId
 * @access  Private (Admin only or self)
 */
const removeParticipant = asyncHandler(async (req, res) => {
    const { roomId, userId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
        throw new NotFoundError('Chat room not found');
    }

    if (chatRoom.type !== 'group') {
        throw new BadRequestError('Cannot remove participants from private chat');
    }

    // User can remove themselves or admin can remove others
    const isSelf = userId === req.userId.toString();
    const isAdmin = chatRoom.isAdmin(req.userId);

    if (!isSelf && !isAdmin) {
        throw new ForbiddenError('Not authorized to remove this participant');
    }

    // Prevent removing the last admin
    if (chatRoom.isAdmin(userId)) {
        const adminCount = chatRoom.participants.filter((p) => p.role === 'admin').length;
        if (adminCount <= 1) {
            throw new BadRequestError('Cannot remove the last admin');
        }
    }

    chatRoom.removeParticipant(userId);
    await chatRoom.save();
    await chatRoom.populate('participants.user', 'username avatar status lastSeen');

    res.json({
        success: true,
        message: 'Participant removed successfully',
        data: { chatRoom },
    });
});

/**
 * @desc    Leave group chat
 * @route   POST /api/chatrooms/:roomId/leave
 * @access  Private
 */
const leaveGroup = asyncHandler(async (req, res) => {
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
        throw new NotFoundError('Chat room not found');
    }

    if (chatRoom.type !== 'group') {
        throw new BadRequestError('Cannot leave private chat');
    }

    if (!chatRoom.isParticipant(req.userId)) {
        throw new BadRequestError('You are not a member of this group');
    }

    // If user is the only admin, assign new admin
    if (chatRoom.isAdmin(req.userId)) {
        const adminCount = chatRoom.participants.filter((p) => p.role === 'admin').length;
        if (adminCount <= 1 && chatRoom.participants.length > 1) {
            const newAdmin = chatRoom.participants.find(
                (p) => p.user.toString() !== req.userId.toString()
            );
            if (newAdmin) {
                newAdmin.role = 'admin';
            }
        }
    }

    chatRoom.removeParticipant(req.userId);

    // If no participants left, deactivate the room
    if (chatRoom.participants.length === 0) {
        chatRoom.isActive = false;
    }

    await chatRoom.save();

    res.json({
        success: true,
        message: 'Left group successfully',
    });
});

/**
 * @desc    Mark chat room as read
 * @route   POST /api/chatrooms/:roomId/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
    const { roomId } = req.params;

    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
        throw new NotFoundError('Chat room not found');
    }

    if (!chatRoom.isParticipant(req.userId)) {
        throw new ForbiddenError('You are not a member of this chat room');
    }

    chatRoom.updateLastRead(req.userId);
    await chatRoom.save();

    res.json({
        success: true,
        message: 'Chat marked as read',
    });
});

module.exports = {
    getChatRooms,
    getChatRoom,
    createPrivateChat,
    createGroupChat,
    updateChatRoom,
    addParticipant,
    removeParticipant,
    leaveGroup,
    markAsRead,
};
