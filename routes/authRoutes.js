const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { auth, authValidation, uploadImage } = require('../middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authValidation.register, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authValidation.login, authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', auth, authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', auth, authValidation.updateProfile, authController.updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', auth, authValidation.changePassword, authController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', auth, authController.logout);

/**
 * @route   POST /api/auth/avatar
 * @desc    Upload avatar
 * @access  Private
 */
router.post('/avatar', auth, uploadImage.single('avatar'), authController.uploadAvatar);

module.exports = router;
