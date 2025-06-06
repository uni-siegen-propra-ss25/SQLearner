import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma Module provides database access through Prisma ORM.
 *
 * This module is responsible for:
 * - Database connection management
 * - Providing the PrismaService to other modules
 * - Managing database transactions
 * - Ensuring proper database connection lifecycle
 *
 * It serves as a central point for database access across the application,
 * using Prisma as the ORM for type-safe database operations.
 *
 * @module PrismaModule
 */
@Module({
    providers: [PrismaService],
    exports: [PrismaService],
})
export class PrismaModule {}
