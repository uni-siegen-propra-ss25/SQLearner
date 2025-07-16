import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DiscussionsController } from './controllers/discussions.controller';
import { DiscussionsService } from './services/discussions.service';

/**
 * Module for handling discussion threads and comments functionality.
 * Provides endpoints for creating topics, adding comments, and managing thread status.
 */
@Module({
    imports: [PrismaModule],
    controllers: [DiscussionsController],
    providers: [DiscussionsService],
    exports: [DiscussionsService],
})
export class DiscussionsModule {}
