// Simple in-memory rate limiter for API routes
// For production, consider using Redis or a dedicated rate limiting service

interface RateLimitConfig {
    windowMs: number // Time window in milliseconds
    maxRequests: number // Max requests per window
}

interface RateLimitEntry {
    count: number
    resetTime: number
}

class RateLimiter {
    private requests: Map<string, RateLimitEntry> = new Map()
    private config: RateLimitConfig

    constructor(config: RateLimitConfig) {
        this.config = config
    }

    /**
     * Check if a request should be allowed
     * @param identifier Unique identifier (e.g., IP address, user ID, or combination)
     * @returns Object with allowed status and remaining requests
     */
    check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
        const now = Date.now()
        const entry = this.requests.get(identifier)

        // Clean up expired entries periodically
        if (this.requests.size > 10000) {
            this.cleanup()
        }

        // If no entry or entry is expired, create new entry
        if (!entry || now > entry.resetTime) {
            const resetTime = now + this.config.windowMs
            this.requests.set(identifier, {
                count: 1,
                resetTime,
            })
            return {
                allowed: true,
                remaining: this.config.maxRequests - 1,
                resetTime,
            }
        }

        // Check if limit exceeded
        if (entry.count >= this.config.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
            }
        }

        // Increment count
        entry.count++
        this.requests.set(identifier, entry)

        return {
            allowed: true,
            remaining: this.config.maxRequests - entry.count,
            resetTime: entry.resetTime,
        }
    }

    /**
     * Clean up expired entries
     */
    private cleanup() {
        const now = Date.now()
        for (const [key, entry] of this.requests.entries()) {
            if (now > entry.resetTime) {
                this.requests.delete(key)
            }
        }
    }

    /**
     * Reset limit for a specific identifier (useful for testing)
     */
    reset(identifier: string) {
        this.requests.delete(identifier)
    }

    /**
     * Clear all rate limit data
     */
    clear() {
        this.requests.clear()
    }
}

// Rate limiter instances for different endpoints
export const scoresRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute per IP
})

export const newsRateLimiter = new RateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 30, // 30 requests per 5 minutes per IP
})

export const teamsRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,     // 30 requests per minute
})

export const statsRateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,     // 60 requests per minute
})

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(request: Request): string {
    // Try to get real IP from various headers (for proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const cfConnectingIp = request.headers.get('cf-connecting-ip')

    if (forwarded) {
        return forwarded.split(',')[0].trim()
    }

    if (realIp) {
        return realIp
    }

    if (cfConnectingIp) {
        return cfConnectingIp
    }

    // Fallback to a default (not ideal for production)
    return 'unknown'
}

/**
 * Format rate limit reset time for Retry-After header
 */
export function getRetryAfterSeconds(resetTime: number): number {
    return Math.ceil((resetTime - Date.now()) / 1000)
}
