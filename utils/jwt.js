const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT Token
 * @param {string} userId - User ID to encode in token
 * @returns {string} - JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

/**
 * Verify JWT Token
 * @param {string} token - Token to verify
 * @returns {object} - Decoded token payload
 */
const verifyToken = (token) => {
    return jwt.verify(token, config.jwtSecret);
};

/**
 * Decode JWT Token without verification
 * @param {string} token - Token to decode
 * @returns {object} - Decoded token payload
 */
const decodeToken = (token) => {
    return jwt.decode(token);
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
};
