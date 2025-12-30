const mongoose = require('mongoose');

/**
 * ChatRoom Schema
 * Supports both private (1-on-1) and group chats
 */
const chatRoomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            maxlength: [100, 'Room name cannot exceed 100 characters'],
            // Required only for group chats
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: '',
        },
        type: {
            type: String,
            enum: ['private', 'group'],
            required: true,
            default: 'private',
        },
        participants: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: String,
                    enum: ['admin', 'member'],
                    default: 'member',
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
                lastRead: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        avatar: {
            type: String,
            default: '', // Group avatar URL
        },
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient querying
chatRoomSchema.index({ 'participants.user': 1 });
chatRoomSchema.index({ type: 1 });
chatRoomSchema.index({ updatedAt: -1 });

/**
 * Check if a user is a participant in the room
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
chatRoomSchema.methods.isParticipant = function (userId) {
    return this.participants.some(
        (p) => p.user.toString() === userId.toString()
    );
};

/**
 * Check if a user is an admin of the room
 * @param {string} userId - User ID to check
 * @returns {boolean}
 */
chatRoomSchema.methods.isAdmin = function (userId) {
    const participant = this.participants.find(
        (p) => p.user.toString() === userId.toString()
    );
    return participant && participant.role === 'admin';
};

/**
 * Add a participant to the room
 * @param {string} userId - User ID to add
 * @param {string} role - Role for the user
 */
chatRoomSchema.methods.addParticipant = function (userId, role = 'member') {
    if (!this.isParticipant(userId)) {
        this.participants.push({ user: userId, role });
    }
};

/**
 * Remove a participant from the room
 * @param {string} userId - User ID to remove
 */
chatRoomSchema.methods.removeParticipant = function (userId) {
    this.participants = this.participants.filter(
        (p) => p.user.toString() !== userId.toString()
    );
};

/**
 * Update last read time for a participant
 * @param {string} userId - User ID
 */
chatRoomSchema.methods.updateLastRead = function (userId) {
    const participant = this.participants.find(
        (p) => p.user.toString() === userId.toString()
    );
    if (participant) {
        participant.lastRead = new Date();
    }
};

/**
 * Static method to find or create a private chat between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<ChatRoom>}
 */
chatRoomSchema.statics.findOrCreatePrivateChat = async function (userId1, userId2) {
    // Find existing private chat between these two users
    let chatRoom = await this.findOne({
        type: 'private',
        'participants.user': { $all: [userId1, userId2] },
        $expr: { $eq: [{ $size: '$participants' }, 2] },
    });

    if (!chatRoom) {
        // Create new private chat
        chatRoom = await this.create({
            type: 'private',
            participants: [
                { user: userId1, role: 'member' },
                { user: userId2, role: 'member' },
            ],
            creator: userId1,
        });
    }

    return chatRoom;
};

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

module.exports = ChatRoom;
