const User = require('../models/User');
const { sanitizeUser, parsePagination, createPaginationMeta } = require('../utils');
const { asyncHandler, NotFoundError } = require('../middleware');

/**
 * @desc    Search users
 * @route   GET /api/users/search
 * @access  Private
 */
const searchUsers = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    if (!q || q.trim().length < 2) {
        return res.json({
            success: true,
            data: {
                users: [],
                pagination: createPaginationMeta(0, page, limit),
            },
        });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    // Find users matching the query, excluding current user
    const query = {
        $or: [
            { username: searchRegex },
            { email: searchRegex },
        ],
        _id: { $ne: req.userId },
    };

    const [users, total] = await Promise.all([
        User.find(query)
            .select('username email avatar status lastSeen')
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: {
            users,
            pagination: createPaginationMeta(total, page, limit),
        },
    });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:userId
 * @access  Private
 */
const getUserById = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId)
        .select('username email avatar status lastSeen bio createdAt');

    if (!user) {
        throw new NotFoundError('User not found');
    }

    res.json({
        success: true,
        data: { user },
    });
});

/**
 * @desc    Get all users (with pagination)
 * @route   GET /api/users
 * @access  Private
 */
const getUsers = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);

    // Exclude current user
    const query = { _id: { $ne: req.userId } };

    const [users, total] = await Promise.all([
        User.find(query)
            .select('username email avatar status lastSeen')
            .skip(skip)
            .limit(limit)
            .sort({ username: 1 })
            .lean(),
        User.countDocuments(query),
    ]);

    res.json({
        success: true,
        data: {
            users,
            pagination: createPaginationMeta(total, page, limit),
        },
    });
});

/**
 * @desc    Get online users
 * @route   GET /api/users/online
 * @access  Private
 */
const getOnlineUsers = asyncHandler(async (req, res) => {
    const users = await User.find({
        status: 'online',
        _id: { $ne: req.userId },
    })
        .select('username avatar status')
        .lean();

    res.json({
        success: true,
        data: { users },
    });
});

/**
 * @desc    Add user to contacts
 * @route   POST /api/users/contacts/:userId
 * @access  Private
 */
const addContact = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Check if user exists
    const contactUser = await User.findById(userId);
    if (!contactUser) {
        throw new NotFoundError('User not found');
    }

    // Add to contacts if not already added
    const user = await User.findByIdAndUpdate(
        req.userId,
        { $addToSet: { contacts: userId } },
        { new: true }
    ).populate('contacts', 'username email avatar status');

    res.json({
        success: true,
        message: 'Contact added successfully',
        data: { contacts: user.contacts },
    });
});

/**
 * @desc    Remove user from contacts
 * @route   DELETE /api/users/contacts/:userId
 * @access  Private
 */
const removeContact = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
        req.userId,
        { $pull: { contacts: userId } },
        { new: true }
    ).populate('contacts', 'username email avatar status');

    res.json({
        success: true,
        message: 'Contact removed successfully',
        data: { contacts: user.contacts },
    });
});

/**
 * @desc    Get user's contacts
 * @route   GET /api/users/contacts
 * @access  Private
 */
const getContacts = asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId)
        .populate('contacts', 'username email avatar status lastSeen');

    res.json({
        success: true,
        data: { contacts: user.contacts || [] },
    });
});

module.exports = {
    searchUsers,
    getUserById,
    getUsers,
    getOnlineUsers,
    addContact,
    removeContact,
    getContacts,
};
