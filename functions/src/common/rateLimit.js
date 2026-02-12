// functions/src/common/rateLimit.js
import { logger } from "firebase-functions";

/**
 * Simple in-memory rate limiter
 * Note: For production, consider using Redis or Firebase Firestore for distributed rate limiting
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = null;
  }

  /**
   * Cleans up old entries periodically
   */
  startCleanup() {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (data.windowStart + data.windowMs < now) {
          this.requests.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Checks if a request should be rate limited
   * @param {string} identifier - Unique identifier (IP, user ID, etc.)
   * @param {number} maxRequests - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
   */
  check(identifier, maxRequests = 100, windowMs = 60000) {
    this.startCleanup();
    
    const now = Date.now();
    const key = `${identifier}:${maxRequests}:${windowMs}`;
    const data = this.requests.get(key);

    if (!data || data.windowStart + windowMs < now) {
      // New window or expired window
      this.requests.set(key, {
        count: 1,
        windowStart: now,
        windowMs,
      });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: now + windowMs,
      };
    }

    if (data.count >= maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: data.windowStart + windowMs,
      };
    }

    // Increment count
    data.count++;
    return {
      allowed: true,
      remaining: maxRequests - data.count,
      resetAt: data.windowStart + windowMs,
    };
  }

  /**
   * Gets client identifier from request
   * @param {import("express").Request} req - Express request
   * @returns {string} Client identifier
   */
  getClientId(req) {
    // Try to get IP from various headers (for proxies/load balancers)
    const forwarded = req.get("X-Forwarded-For");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    
    const realIp = req.get("X-Real-IP");
    if (realIp) {
      return realIp;
    }
    
    return req.ip || req.connection?.remoteAddress || "unknown";
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware factory
 * @param {Object} options - Rate limit options
 * @param {number} options.maxRequests - Maximum requests per window
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {Function} options.getIdentifier - Custom function to get client identifier
 * @returns {Function} Express middleware
 */
export function createRateLimit(options = {}) {
  const {
    maxRequests = 100,
    windowMs = 60000, // 1 minute default
    getIdentifier = null,
  } = options;

  return (req, res, next) => {
    const identifier = getIdentifier 
      ? getIdentifier(req) 
      : rateLimiter.getClientId(req);
    
    const result = rateLimiter.check(identifier, maxRequests, windowMs);

    // Set rate limit headers
    res.set({
      "X-RateLimit-Limit": maxRequests,
      "X-RateLimit-Remaining": result.remaining,
      "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000),
    });

    if (!result.allowed) {
      logger.warn("Rate limit exceeded", { identifier, maxRequests, windowMs });
      return res.status(429).json({
        ok: false,
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      });
    }

    next();
  };
}

/**
 * Default rate limiters for common use cases
 */
export const rateLimits = {
  // Strict rate limit for sensitive operations
  strict: createRateLimit({ maxRequests: 10, windowMs: 60000 }),
  
  // Standard rate limit for general API endpoints
  standard: createRateLimit({ maxRequests: 100, windowMs: 60000 }),
  
  // Lenient rate limit for public endpoints
  lenient: createRateLimit({ maxRequests: 1000, windowMs: 60000 }),
  
  // Per-minute rate limit
  perMinute: createRateLimit({ maxRequests: 60, windowMs: 60000 }),
  
  // Per-hour rate limit
  perHour: createRateLimit({ maxRequests: 1000, windowMs: 3600000 }),
};
