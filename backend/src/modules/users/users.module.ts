import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Users Module manages user-related functionality and data.
 * 
 * This module handles all user-related operations including:
 * - User profile management
 * - Role-based access control (Student, Tutor, Admin)
 * - User preferences and settings
 * - Progress tracking
 * 
 * It provides essential user management services that are used
 * across the application, particularly in authentication and
 * authorization processes.
 * 
 * @module UsersModule
 */
@Module({
    imports: [PrismaModule],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule {}
