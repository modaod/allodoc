import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenService } from './token.service';

@Injectable()
export class TokenCleanupService {
    private readonly logger = new Logger(TokenCleanupService.name);

    constructor(private readonly tokenService: TokenService) {}

    /**
     * Run cleanup every hour to remove expired blacklisted tokens
     */
    @Cron(CronExpression.EVERY_HOUR)
    async handleCleanup() {
        try {
            this.logger.log('Starting token blacklist cleanup...');
            await this.tokenService.cleanupExpiredBlacklistEntries();
            await this.tokenService.cleanupExpiredTokens();
            this.logger.log('Token blacklist cleanup completed');
        } catch (error) {
            this.logger.error('Error during token cleanup:', error);
        }
    }

    /**
     * Also run cleanup on application startup
     */
    async onModuleInit() {
        await this.handleCleanup();
    }
}
