import { RateLimiter } from '@/lib/rate-limiter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('RateLimiter', () => {
    // Mock Date.now to control time
    let now = 0
    const realDateNow = Date.now

    beforeEach(() => {
        // Reset time to 0
        now = 0

        // Mock Date.now
        Date.now = vi.fn(() => now)
    })

    afterEach(() => {
        // Restore original Date.now
        Date.now = realDateNow
    })

    it('should allow requests within the limit', async () => {
        const limiter = new RateLimiter({
            tokensPerInterval: 3,
            interval: 'minute',
            uniqueTokenPerInterval: 10,
        })

        // First request should be allowed
        let result = await limiter.limit('user1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(2)

        // Second request should be allowed
        result = await limiter.limit('user1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(1)

        // Third request should be allowed
        result = await limiter.limit('user1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(0)

        // Fourth request should be blocked
        result = await limiter.limit('user1')
        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)
    })

    it('should reset tokens after interval', async () => {
        const limiter = new RateLimiter({
            tokensPerInterval: 2,
            interval: 'minute',
            uniqueTokenPerInterval: 10,
        })

        // First request should be allowed
        let result = await limiter.limit('user1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(1)

        // Second request should be allowed
        result = await limiter.limit('user1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(0)

        // Third request should be blocked
        result = await limiter.limit('user1')
        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)

        // Advance time by more than 1 minute to ensure reset
        now += 61 * 1000

        // Request after interval should be allowed
        result = await limiter.limit('user1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(1) // Should have 1 remaining after using 1
    })

    it('should track different users separately', async () => {
        const limiter = new RateLimiter({
            tokensPerInterval: 2,
            interval: 'minute',
            uniqueTokenPerInterval: 10,
        })

        // First user, first request
        let result = await limiter.limit('user1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(1)

        // Second user, first request
        result = await limiter.limit('user2')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(1)

        // First user, second request
        result = await limiter.limit('user1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(0)

        // First user, third request (should be blocked)
        result = await limiter.limit('user1')
        expect(result.success).toBe(false)
        expect(result.remaining).toBe(0)

        // Second user, second request (should still be allowed)
        result = await limiter.limit('user2')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(0)
    })

    it('should clean up old entries', async () => {
        const limiter = new RateLimiter({
            tokensPerInterval: 1,
            interval: 'minute',
            uniqueTokenPerInterval: 2, // Only allow 2 unique users
        })

        // First user
        await limiter.limit('user1')

        // Second user
        await limiter.limit('user2')

        // Advance time by 2 minutes for user1
        now += 2 * 60 * 1000

        // Third user - should trigger cleanup of old entries
        await limiter.limit('user3')

        // First user should be removed, so this should create a new entry
        const result = await limiter.limit('user1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(0)
    })

    it('should calculate reset time correctly', async () => {
        const limiter = new RateLimiter({
            tokensPerInterval: 1,
            interval: 'minute',
            uniqueTokenPerInterval: 10,
        })

        // Set current time
        now = 1000 * 60 * 10 // 10 minutes after epoch

        // Make a request
        const result = await limiter.limit('user1')

        // Reset time should be 11 minutes after epoch (in seconds)
        expect(result.reset).toBe(60 * 11)
    })
})
