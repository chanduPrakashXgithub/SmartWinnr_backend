const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('./errorHandler');

/**
 * Validation middleware - checks for validation errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
        }));

        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: errorMessages,
        });
    }

    next();
};

/**
 * Auth validation rules
 */
const authValidation = {
    register: [
        body('username')
            .trim()
            .notEmpty()
            .withMessage('Username is required')
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3 and 30 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Password is required')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
        validate,
    ],

    login: [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        validate,
    ],

    updateProfile: [
        body('username')
            .optional()
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3 and 30 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers, and underscores'),
        body('bio')
            .optional()
            .trim()
            .isLength({ max: 200 })
            .withMessage('Bio cannot exceed 200 characters'),
        validate,
    ],

    changePassword: [
        body('currentPassword')
            .notEmpty()
            .withMessage('Current password is required'),
        body('newPassword')
            .notEmpty()
            .withMessage('New password is required')
            .isLength({ min: 6 })
            .withMessage('New password must be at least 6 characters'),
        validate,
    ],
};

/**
 * Chat room validation rules
 */
const chatRoomValidation = {
    createGroup: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Group name is required')
            .isLength({ min: 1, max: 100 })
            .withMessage('Group name must be between 1 and 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        body('participants')
            .optional()
            .isArray()
            .withMessage('Participants must be an array'),
        validate,
    ],

    updateGroup: [
        param('roomId')
            .isMongoId()
            .withMessage('Invalid room ID'),
        body('name')
            .optional()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Group name must be between 1 and 100 characters'),
        body('description')
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage('Description cannot exceed 500 characters'),
        validate,
    ],

    addParticipant: [
        param('roomId')
            .isMongoId()
            .withMessage('Invalid room ID'),
        body('userId')
            .notEmpty()
            .withMessage('User ID is required')
            .isMongoId()
            .withMessage('Invalid user ID'),
        validate,
    ],

    privateChat: [
        body('userId')
            .notEmpty()
            .withMessage('User ID is required')
            .isMongoId()
            .withMessage('Invalid user ID'),
        validate,
    ],
};

/**
 * Message validation rules
 */
const messageValidation = {
    sendMessage: [
        body('chatRoomId')
            .notEmpty()
            .withMessage('Chat room ID is required')
            .isMongoId()
            .withMessage('Invalid chat room ID'),
        body('content')
            .optional()
            .trim()
            .isLength({ max: 5000 })
            .withMessage('Message cannot exceed 5000 characters'),
        validate,
    ],

    getMessages: [
        param('roomId')
            .isMongoId()
            .withMessage('Invalid room ID'),
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100'),
        validate,
    ],

    editMessage: [
        param('messageId')
            .isMongoId()
            .withMessage('Invalid message ID'),
        body('content')
            .trim()
            .notEmpty()
            .withMessage('Message content is required')
            .isLength({ max: 5000 })
            .withMessage('Message cannot exceed 5000 characters'),
        validate,
    ],
};

/**
 * Param ID validation
 */
const paramValidation = {
    mongoId: (paramName = 'id') => [
        param(paramName)
            .isMongoId()
            .withMessage(`Invalid ${paramName}`),
        validate,
    ],
};

module.exports = {
    validate,
    authValidation,
    chatRoomValidation,
    messageValidation,
    paramValidation,
};
