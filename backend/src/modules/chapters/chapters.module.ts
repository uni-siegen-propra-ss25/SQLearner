import { Module } from '@nestjs/common';
import { ChaptersController } from './controllers/chapters.controller';
import { ChaptersService } from './services/chapters.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Chapter Module manages the learning chapters of the application.
 *
 * This module provides functionality for managing educational chapters,
 * which are the highest-level organizational units in the learning path.
 * Each chapter can contain multiple topics and is used to structure
 * the learning content in a hierarchical way.
 *
 * @module ChaptersModule
 */
@Module({
    imports: [PrismaModule],
    controllers: [ChaptersController],
    providers: [ChaptersService],
    exports: [ChaptersService],
})
export class ChaptersModule {}
