const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { BadRequestError } = require('./errorHandler');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Multer storage configuration
 * Stores files locally with unique names
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Organize uploads by type
        let uploadPath = uploadsDir;

        if (file.mimetype.startsWith('image/')) {
            uploadPath = path.join(uploadsDir, 'images');
        } else {
            uploadPath = path.join(uploadsDir, 'files');
        }

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '_')
            .substring(0, 50);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});

/**
 * File filter to validate file types
 */
const fileFilter = (req, file, cb) => {
    // Check if file type is allowed
    if (config.upload.allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestError(`File type ${file.mimetype} is not allowed`), false);
    }
};

/**
 * Image filter - only allows images
 */
const imageFilter = (req, file, cb) => {
    if (config.upload.allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestError('Only image files are allowed'), false);
    }
};

/**
 * Main upload middleware configuration
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
    },
});

/**
 * Image-only upload middleware
 */
const uploadImage = multer({
    storage,
    fileFilter: imageFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
    },
});

/**
 * Memory storage for Cloudinary uploads
 * Stores file in memory before uploading to cloud
 */
const memoryStorage = multer.memoryStorage();

const uploadToMemory = multer({
    storage: memoryStorage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize,
    },
});

/**
 * Delete file from local storage
 * @param {string} filePath - Path to file
 */
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

/**
 * Get file URL for local storage
 * @param {object} file - Multer file object
 * @returns {string} - File URL
 */
const getFileUrl = (file) => {
    const relativePath = file.path.split('uploads')[1].replace(/\\/g, '/');
    return `/uploads${relativePath}`;
};

module.exports = {
    upload,
    uploadImage,
    uploadToMemory,
    deleteFile,
    getFileUrl,
};
