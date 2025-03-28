/**
 * A simple in-memory rate limiter
 * In production, you would use a distributed rate limiter with Redis or similar
 */

type Interval = 'second' | 'minute' | 'hour' | 'day'

interface RateLimiterOptions {
    tokensPerInterval: number
    interval: Interval
    uniqueTokenPerInterval: number
}

interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number // timestamp in seconds
}

export class RateLimiter {
    private tokensPerInterval: number
    private interval: Interval
    private uniqueTokenPerInterval: number
    private clients: Map<string, { tokens: number; lastReset: number }>

    constructor(options: RateLimiterOptions) {
        this.tokensPerInterval = options.tokensPerInterval
        this.interval = options.interval
        this.uniqueTokenPerInterval = options.uniqueTokenPerInterval
        this.clients = new Map()
    }

    private getIntervalMs(): number {
        switch (this.interval) {
            case 'second':
                return 1000
            case 'minute':
                return 60 * 1000
            case 'hour':
                return 60 * 60 * 1000
            case 'day':
                return 24 * 60 * 60 * 1000
            default:
                return 60 * 1000 // default to minute
        }
    }

    async limit(identifier: string): Promise<RateLimitResult> {
        const now = Date.now()
        const intervalMs = this.getIntervalMs()

        // Clean up old entries periodically
        if (this.clients.size > this.uniqueTokenPerInterval) {
            const entriesToRemove: string[] = []

            this.clients.forEach((client, key) => {
                if (now - client.lastReset > intervalMs) {
                    entriesToRemove.push(key)
                }
            })

            for (const key of entriesToRemove) {
                this.clients.delete(key)
            }
        }

        // Get or create client entry
        let clientData = this.clients.get(identifier)

        if (!clientData) {
            clientData = { tokens: this.tokensPerInterval, lastReset: now }
            this.clients.set(identifier, clientData)
        } else if (now - clientData.lastReset > intervalMs) {
            // Reset tokens if interval has passed
            clientData.tokens = this.tokensPerInterval
            clientData.lastReset = now
        }

        // Calculate remaining tokens and next reset time
        const remaining = Math.max(0, clientData.tokens)
        const success = remaining > 0

        // Consume a token if successful
        if (success) {
            clientData.tokens -= 1
        }

        // Calculate reset time in seconds
        const resetTime = Math.ceil((clientData.lastReset + intervalMs) / 1000)

        return {
            success,
            limit: this.tokensPerInterval,
            remaining: clientData.tokens,
            reset: resetTime,
        }
    }
}
