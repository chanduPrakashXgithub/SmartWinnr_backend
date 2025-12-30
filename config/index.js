const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    // Server Configuration
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // MongoDB Configuration
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app',

    // JWT Configuration
    jwtSecret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // Cloudinary Configuration
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },

    // Client URL for CORS
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

    // Upload Configuration
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        allowedFileTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
        ],
    },
};
