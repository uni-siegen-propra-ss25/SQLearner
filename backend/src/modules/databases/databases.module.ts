import { Module } from '@nestjs/common';
import { DatabasesController } from './controllers/databases.controller';
import { DatabasesService } from './services/databases.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Databases Module manages the SQL databases used for learning exercises.
 *
 * This module handles the creation, management, and manipulation of SQL databases
 * that students use for practice. It provides functionality for:
 * - Database creation and management
 * - Table operations
 * - Table data manipulation
 * - SQL file imports
 *
 * @module DatabasesModule
 */
@Module({
    imports: [PrismaModule],
    controllers: [DatabasesController],
    providers: [
        DatabasesService
    ],
    exports: [
        DatabasesService
    ],
})
export class DatabasesModule {}
