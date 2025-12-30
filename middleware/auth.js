const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        // Extract token
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid token format.',
            });
        }

        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret);

        // Find user and attach to request
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token may be invalid.',
            });
        }

        // Attach user to request object
        req.user = user;
        req.userId = user._id;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired.',
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error.',
        });
    }
};

/**
 * Optional Auth Middleware
 * Attempts to authenticate but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, config.jwtSecret);
            const user = await User.findById(decoded.userId).select('-password');

            if (user) {
                req.user = user;
                req.userId = user._id;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

/**
 * Socket.IO Authentication Middleware
 * Verifies JWT token for socket connections
 */
const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return next(new Error('User not found'));
        }

        // Attach user to socket
        socket.user = user;
        socket.userId = user._id.toString();

        next();
    } catch (error) {
        console.error('Socket auth error:', error.message);
        next(new Error('Invalid token'));
    }
};

module.exports = {
    auth,
    optionalAuth,
    socketAuth,
};
