const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { auth, paramValidation } = require('../middleware');

// All routes require authentication
router.use(auth);

/**
 * @route   GET /api/users/search
 * @desc    Search users
 * @access  Private
 */
router.get('/search', userController.searchUsers);

/**
 * @route   GET /api/users/online
 * @desc    Get online users
 * @access  Private
 */
router.get('/online', userController.getOnlineUsers);

/**
 * @route   GET /api/users/contacts
 * @desc    Get user's contacts
 * @access  Private
 */
router.get('/contacts', userController.getContacts);

/**
 * @route   POST /api/users/contacts/:userId
 * @desc    Add user to contacts
 * @access  Private
 */
router.post('/contacts/:userId', ...paramValidation.mongoId('userId'), userController.addContact);

/**
 * @route   DELETE /api/users/contacts/:userId
 * @desc    Remove user from contacts
 * @access  Private
 */
router.delete('/contacts/:userId', ...paramValidation.mongoId('userId'), userController.removeContact);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:userId', ...paramValidation.mongoId('userId'), userController.getUserById);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private
 */
router.get('/', userController.getUsers);

module.exports = router;
