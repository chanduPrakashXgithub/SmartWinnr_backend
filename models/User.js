const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Stores user authentication and profile information
 */
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [30, 'Username cannot exceed 30 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't include password in queries by default
        },
        avatar: {
            type: String,
            default: '', // URL to user's avatar image
        },
        status: {
            type: String,
            enum: ['online', 'offline', 'away', 'busy'],
            default: 'offline',
        },
        lastSeen: {
            type: Date,
            default: Date.now,
        },
        bio: {
            type: String,
            maxlength: [200, 'Bio cannot exceed 200 characters'],
            default: '',
        },
        contacts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true, // Adds createdAt and updatedAt
    }
);

// Index for faster queries
userSchema.index({ username: 'text', email: 'text' });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Compare provided password with hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Get public profile (excludes sensitive data)
 * @returns {object}
 */
userSchema.methods.toPublicProfile = function () {
    return {
        _id: this._id,
        username: this.username,
        email: this.email,
        avatar: this.avatar,
        status: this.status,
        lastSeen: this.lastSeen,
        bio: this.bio,
        createdAt: this.createdAt,
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
