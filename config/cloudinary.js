const cloudinary = require('cloudinary').v2;
const config = require('./index');

/**
 * Configure Cloudinary for cloud media storage
 * This is optional - falls back to local storage if not configured
 */
const configureCloudinary = () => {
    if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
        cloudinary.config({
            cloud_name: config.cloudinary.cloudName,
            api_key: config.cloudinary.apiKey,
            api_secret: config.cloudinary.apiSecret,
        });
        console.log('✅ Cloudinary configured successfully');
        return true;
    }
    console.log('ℹ️ Cloudinary not configured - using local storage');
    return false;
};

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadToCloudinary = async (filePath, folder = 'chat-app') => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: 'auto',
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            size: result.bytes,
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload file to cloud storage');
    }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>}
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete file from cloud storage');
    }
};

module.exports = {
    configureCloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    cloudinary,
};
