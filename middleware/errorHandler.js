/**
 * Custom Error Classes for the application
 */

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation failed', errors = []) {
        super(message, 422);
        this.errors = errors;
    }
}

class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(message, 500);
    }
}

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    // Default error values
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }

    // Handle specific error types
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = `Invalid ${err.path}: ${err.value}`;
        error = new BadRequestError(message);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = new ConflictError(message);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((el) => el.message);
        const message = `Invalid input data: ${errors.join('. ')}`;
        error = new ValidationError(message, errors);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new UnauthorizedError('Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        error = new UnauthorizedError('Token has expired');
    }

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = new BadRequestError('File too large');
        } else {
            error = new BadRequestError(err.message);
        }
    }

    // Send error response
    if (process.env.NODE_ENV === 'development') {
        return res.status(error.statusCode || 500).json({
            success: false,
            status: error.status,
            message: error.message,
            errors: error.errors,
            stack: err.stack,
        });
    }

    // Production error response
    if (error.isOperational) {
        // Operational, trusted error: send message to client
        return res.status(error.statusCode).json({
            success: false,
            status: error.status,
            message: error.message,
            errors: error.errors,
        });
    }

    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Something went wrong',
    });
};

/**
 * Handle 404 Not Found
 */
const notFound = (req, res, next) => {
    const error = new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`);
    next(error);
};

/**
 * Async Handler Wrapper
 * Wraps async functions to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    InternalServerError,
    errorHandler,
    notFound,
    asyncHandler,
};
