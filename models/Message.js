const mongoose = require('mongoose');

/**
 * Message Schema
 * Stores chat messages with support for text and media
 */
const messageSchema = new mongoose.Schema(
    {
        chatRoom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatRoom',
            required: [true, 'Chat room is required'],
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender is required'],
        },
        content: {
            type: String,
            trim: true,
            maxlength: [5000, 'Message cannot exceed 5000 characters'],
        },
        messageType: {
            type: String,
            enum: ['text', 'image', 'file', 'system'],
            default: 'text',
        },
        // Media attachment details
        media: {
            url: {
                type: String,
            },
            publicId: {
                type: String, // For Cloudinary
            },
            filename: {
                type: String,
            },
            mimetype: {
                type: String,
            },
            size: {
                type: Number, // File size in bytes
            },
        },
        // Message status tracking
        readBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                readAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        // For reply functionality
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        // Soft delete flag
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        // Edit tracking
        isEdited: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient message fetching
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

/**
 * Mark message as read by a user
 * @param {string} userId - User ID who read the message
 */
messageSchema.methods.markAsRead = function (userId) {
    const alreadyRead = this.readBy.some(
        (r) => r.user.toString() === userId.toString()
    );

    if (!alreadyRead && this.sender.toString() !== userId.toString()) {
        this.readBy.push({ user: userId, readAt: new Date() });
    }
};

/**
 * Soft delete a message
 */
messageSchema.methods.softDelete = function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.content = 'This message has been deleted';
    this.media = undefined;
};

/**
 * Edit message content
 * @param {string} newContent - New message content
 */
messageSchema.methods.editContent = function (newContent) {
    this.content = newContent;
    this.isEdited = true;
    this.editedAt = new Date();
};

/**
 * Virtual to check if message has media
 */
messageSchema.virtual('hasMedia').get(function () {
    return this.media && this.media.url;
});

/**
 * Format message for client response
 * @returns {object}
 */
messageSchema.methods.toJSON = function () {
    const message = this.toObject();

    // If message is deleted, hide content
    if (message.isDeleted) {
        message.content = 'This message has been deleted';
        delete message.media;
    }

    return message;
};

/**
 * Static method to get messages for a chat room with pagination
 * @param {string} chatRoomId - Chat room ID
 * @param {object} options - Pagination options
 * @returns {Promise<Array>}
 */
messageSchema.statics.getMessages = async function (chatRoomId, options = {}) {
    const {
        page = 1,
        limit = 50,
        before = null, // Cursor-based pagination
    } = options;

    const query = {
        chatRoom: chatRoomId,
        isDeleted: false,
    };

    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('sender', 'username avatar status')
        .populate('replyTo', 'content sender')
        .lean();

    // Return in chronological order
    return messages.reverse();
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
