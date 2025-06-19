import { Injectable, Logger } from '@nestjs/common';
import { RateLimiterMemory } from 'rate-limiter-flexible';

@Injectable()
export class QueryRateLimiterService {
    private readonly logger = new Logger(QueryRateLimiterService.name);
    private readonly limiter: RateLimiterMemory;

    constructor() {
        this.limiter = new RateLimiterMemory({
            points: 10, // Number of queries
            duration: 60, // Per minute
        });
    }

    /**
     * Check if a user can execute more queries
     * @param userId The ID of the user
     * @returns Promise<boolean> Whether the user can execute more queries
     */
    async canExecuteQuery(userId: number): Promise<boolean> {
        try {
            await this.limiter.consume(userId.toString());
            return true;
        } catch (error) {
            this.logger.warn(`Rate limit exceeded for user ${userId}`);
            return false;
        }
    }

    /**
     * Get remaining points for a user
     * @param userId The ID of the user
     * @returns Promise<number> Remaining points
     */
    async getRemainingPoints(userId: number): Promise<number> {
        const res = await this.limiter.get(userId.toString());
        return res ? res.remainingPoints : this.limiter.points;
    }
}
