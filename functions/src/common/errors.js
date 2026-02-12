// functions/src/common/errors.js
import { logger } from "firebase-functions";

/**
 * Custom error class for application errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates a standardized error response
 * @param {Error} error - Error object
 * @param {Object} options - Additional options
 * @returns {Object} Standardized error response
 */
export function createErrorResponse(error, options = {}) {
  const { 
    includeStack = false, 
    defaultMessage = "An error occurred",
    logError = true 
  } = options;

  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || defaultMessage;
  const code = error.code || null;

  if (logError) {
    if (statusCode >= 500) {
      logger.error("Server error", { 
        message, 
        code, 
        stack: includeStack ? error.stack : undefined 
      });
    } else {
      logger.warn("Client error", { message, code, statusCode });
    }
  }

  const response = {
    ok: false,
    error: message,
  };

  if (code) {
    response.code = code;
  }

  if (includeStack && process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  return { response, statusCode };
}

/**
 * Handles errors in async route handlers
 * @param {Function} handler - Async route handler function
 * @returns {Function} Wrapped handler with error handling
 */
export function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      const { response, statusCode } = createErrorResponse(error);
      return res.status(statusCode).json(response);
    }
  };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  BAD_REQUEST: "BAD_REQUEST",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
};

/**
 * Creates common error instances
 */
export const Errors = {
  unauthorized: (message = "Unauthorized") => 
    new AppError(message, 401, ErrorCodes.UNAUTHORIZED),
  
  forbidden: (message = "Forbidden") => 
    new AppError(message, 403, ErrorCodes.FORBIDDEN),
  
  notFound: (message = "Not found") => 
    new AppError(message, 404, ErrorCodes.NOT_FOUND),
  
  validationError: (message = "Validation error") => 
    new AppError(message, 400, ErrorCodes.VALIDATION_ERROR),
  
  rateLimitExceeded: (message = "Rate limit exceeded") => 
    new AppError(message, 429, ErrorCodes.RATE_LIMIT_EXCEEDED),
  
  badRequest: (message = "Bad request") => 
    new AppError(message, 400, ErrorCodes.BAD_REQUEST),
  
  internalError: (message = "Internal server error") => 
    new AppError(message, 500, ErrorCodes.INTERNAL_ERROR),
};
