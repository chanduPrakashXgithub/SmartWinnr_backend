const express = require('express');
const router = express.Router();
const { messageController } = require('../controllers');
const { auth, messageValidation, paramValidation, upload } = require('../middleware');

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/messages/unread/count
 * @desc    Get unread message count
 * @access  Private
 */
router.get('/unread/count', messageController.getUnreadCount);

/**
 * @route   GET /api/messages/:roomId
 * @desc    Get messages for a chat room
 * @access  Private
 */
router.get('/:roomId', messageValidation.getMessages, messageController.getMessages);

/**
 * @route   POST /api/messages
 * @desc    Send a message (REST fallback)
 * @access  Private
 */
router.post('/', messageValidation.sendMessage, messageController.sendMessage);

/**
 * @route   POST /api/messages/media
 * @desc    Send a message with media attachment
 * @access  Private
 */
router.post('/media', upload.single('file'), messageController.sendMediaMessage);

/**
 * @route   PUT /api/messages/:messageId
 * @desc    Edit a message
 * @access  Private (Message owner only)
 */
router.put('/:messageId', messageValidation.editMessage, messageController.editMessage);

/**
 * @route   DELETE /api/messages/:messageId
 * @desc    Delete a message
 * @access  Private (Message owner only)
 */
router.delete('/:messageId', ...paramValidation.mongoId('messageId'), messageController.deleteMessage);

/**
 * @route   POST /api/messages/:messageId/read
 * @desc    Mark message as read
 * @access  Private
 */
router.post('/:messageId/read', ...paramValidation.mongoId('messageId'), messageController.markAsRead);

module.exports = router;
