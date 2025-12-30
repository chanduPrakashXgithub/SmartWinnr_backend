const { auth, optionalAuth, socketAuth } = require('./auth');
const {
    errorHandler,
    notFound,
    asyncHandler,
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
} = require('./errorHandler');
const { upload, uploadImage, deleteFile, getFileUrl } = require('./upload');
const {
    validate,
    authValidation,
    chatRoomValidation,
    messageValidation,
    paramValidation,
} = require('./validation');

module.exports = {
    // Auth
    auth,
    optionalAuth,
    socketAuth,

    // Error handling
    errorHandler,
    notFound,
    asyncHandler,
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,

    // Upload
    upload,
    uploadImage,
    deleteFile,
    getFileUrl,

    // Validation
    validate,
    authValidation,
    chatRoomValidation,
    messageValidation,
    paramValidation,
};
