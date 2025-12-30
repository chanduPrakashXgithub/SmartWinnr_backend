const User = require('../models/User');
const { generateToken, sanitizeUser } = require('../utils');
const { asyncHandler, BadRequestError, NotFoundError } = require('../middleware');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new BadRequestError('Email already registered');
        }
        throw new BadRequestError('Username already taken');
    }

    // Create new user
    const user = await User.create({
        username,
        email,
        password,
        status: 'online',
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
            user: sanitizeUser(user),
            token,
        },
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new BadRequestError('Invalid email or password');
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        throw new BadRequestError('Invalid email or password');
    }

    // Update user status
    user.status = 'online';
    user.lastSeen = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: sanitizeUser(user),
            token,
        },
    });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);

    if (!user) {
        throw new NotFoundError('User not found');
    }

    res.json({
        success: true,
        data: {
            user: sanitizeUser(user),
        },
    });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
    const { username, bio, avatar } = req.body;

    // Check if username is taken
    if (username) {
        const existingUser = await User.findOne({
            username,
            _id: { $ne: req.userId },
        });

        if (existingUser) {
            throw new BadRequestError('Username already taken');
        }
    }

    const user = await User.findByIdAndUpdate(
        req.userId,
        {
            ...(username && { username }),
            ...(bio !== undefined && { bio }),
            ...(avatar && { avatar }),
        },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new NotFoundError('User not found');
    }

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            user: sanitizeUser(user),
        },
    });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password');

    if (!user) {
        throw new NotFoundError('User not found');
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
        throw new BadRequestError('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id);

    res.json({
        success: true,
        message: 'Password changed successfully',
        data: { token },
    });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    // Update user status
    await User.findByIdAndUpdate(req.userId, {
        status: 'offline',
        lastSeen: new Date(),
    });

    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});

/**
 * @desc    Upload avatar
 * @route   POST /api/auth/avatar
 * @access  Private
 */
const uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new BadRequestError('Please upload an image');
    }

    // Get file URL
    const avatarUrl = `/uploads/images/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
        req.userId,
        { avatar: avatarUrl },
        { new: true }
    );

    if (!user) {
        throw new NotFoundError('User not found');
    }

    res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
            avatar: avatarUrl,
            user: sanitizeUser(user),
        },
    });
});

module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    logout,
    uploadAvatar,
};
