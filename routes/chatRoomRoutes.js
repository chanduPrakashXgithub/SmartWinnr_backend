const express = require('express');
const router = express.Router();
const { chatRoomController } = require('../controllers');
const { auth, chatRoomValidation, paramValidation } = require('../middleware');

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/chatrooms
 * @desc    Get all chat rooms for current user
 * @access  Private
 */
router.get('/', chatRoomController.getChatRooms);

/**
 * @route   POST /api/chatrooms/private
 * @desc    Create or get private chat
 * @access  Private
 */
router.post('/private', chatRoomValidation.privateChat, chatRoomController.createPrivateChat);

/**
 * @route   POST /api/chatrooms/group
 * @desc    Create a group chat room
 * @access  Private
 */
router.post('/group', chatRoomValidation.createGroup, chatRoomController.createGroupChat);

/**
 * @route   GET /api/chatrooms/:roomId
 * @desc    Get a single chat room by ID
 * @access  Private
 */
router.get('/:roomId', ...paramValidation.mongoId('roomId'), chatRoomController.getChatRoom);

/**
 * @route   PUT /api/chatrooms/:roomId
 * @desc    Update group chat room
 * @access  Private (Admin only)
 */
router.put('/:roomId', chatRoomValidation.updateGroup, chatRoomController.updateChatRoom);

/**
 * @route   POST /api/chatrooms/:roomId/participants
 * @desc    Add participant to group
 * @access  Private (Admin only)
 */
router.post('/:roomId/participants', chatRoomValidation.addParticipant, chatRoomController.addParticipant);

/**
 * @route   DELETE /api/chatrooms/:roomId/participants/:userId
 * @desc    Remove participant from group
 * @access  Private (Admin only or self)
 */
router.delete(
    '/:roomId/participants/:userId',
    ...paramValidation.mongoId('roomId'),
    chatRoomController.removeParticipant
);

/**
 * @route   POST /api/chatrooms/:roomId/leave
 * @desc    Leave group chat
 * @access  Private
 */
router.post('/:roomId/leave', ...paramValidation.mongoId('roomId'), chatRoomController.leaveGroup);

/**
 * @route   POST /api/chatrooms/:roomId/read
 * @desc    Mark chat room as read
 * @access  Private
 */
router.post('/:roomId/read', ...paramValidation.mongoId('roomId'), chatRoomController.markAsRead);

module.exports = router;
