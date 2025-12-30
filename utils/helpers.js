/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    // Less than 24 hours ago
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // Less than a week ago
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[d.getDay()];
    }

    // Older than a week
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Generate a random string
 * @param {number} length - Length of string
 * @returns {string}
 */
const generateRandomString = (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Sanitize user object for response
 * @param {object} user - User object
 * @returns {object} - Sanitized user
 */
const sanitizeUser = (user) => {
    if (!user) return null;

    const { password, __v, ...sanitized } = user.toObject ? user.toObject() : user;
    return sanitized;
};

/**
 * Parse pagination parameters
 * @param {object} query - Request query object
 * @returns {object} - Pagination params
 */
const parsePagination = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Create pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Pagination metadata
 */
const createPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Truncate string
 * @param {string} str - String to truncate
 * @param {number} length - Max length
 * @returns {string}
 */
const truncate = (str, length = 100) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
};

module.exports = {
    formatDate,
    generateRandomString,
    sanitizeUser,
    parsePagination,
    createPaginationMeta,
    sleep,
    truncate,
};
