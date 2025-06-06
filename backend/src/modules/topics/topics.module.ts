import { Module } from '@nestjs/common';
import { TopicsController } from './controllers/topics.controller';
import { TopicsService } from './services/topics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChaptersModule } from '../chapters/chapters.module';

/**
 * Topics Module manages the sub-sections within chapters.
 *
 * This module handles the organization of learning content at the topic level.
 * Topics are grouped within chapters and contain exercises. The module provides
 * functionality for:
 * - Creating and managing topics
 * - Organizing topics within chapters
 * - Managing the relationship between topics and exercises
 * - Tracking topic completion and progress
 *
 * @module TopicsModule
 */
@Module({
    imports: [PrismaModule, ChaptersModule],
    controllers: [TopicsController],
    providers: [TopicsService],
    exports: [TopicsService],
})
export class TopicsModule {}
