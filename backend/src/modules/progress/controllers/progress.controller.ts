import { Controller, Get, Post, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { ProgressService } from '../services/progress.service';
import { UserProgressSummary, ExerciseProgressUpdate } from '../models/progress.model';

/**
 * Controller responsible for handling user progress tracking and statistics endpoints.
 * Provides REST API endpoints for retrieving and updating exercise completion progress.
 * All endpoints require JWT authentication and role-based authorization.
 */
@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
    constructor(private readonly progressService: ProgressService) {}

    /**
     * Retrieves all users' progress summaries.
     * Only accessible by tutors and admins.
     * 
     * @returns {Promise<UserProgressSummary[]>} Array of progress summaries for all users
     */
    @Get('users')
    @Roles('TUTOR', 'ADMIN')
    async getAllUsersProgress(): Promise<UserProgressSummary[]> {
        return this.progressService.getAllUsersProgress();
    }

    /**
     * Retrieves the authenticated student's own progress summary.
     * Returns comprehensive progress data including completion statistics and chapter breakdown.
     * 
     * @param {number} userId - The authenticated user's ID extracted from JWT token
     * @returns {Promise<UserProgressSummary>} Complete progress summary with exercise completion stats
     */
    @Get('user')
    @Roles('STUDENT', 'TUTOR', 'ADMIN')
    async getUserProgress(@GetUser('id') userId: number): Promise<UserProgressSummary> {
        return this.progressService.getUserProgress(userId);
    }

    /**
     * Retrieves progress summary for any user by their ID.
     * Allows tutors and admins to view student progress for monitoring.
     * 
     * @param {number} userId - The target user's ID from URL parameter
     * @returns {Promise<UserProgressSummary>} Complete progress summary with exercise completion stats
     */
    @Get('user/:id')
    @Roles('TUTOR', 'ADMIN')
    async getUserProgressById(@Param('id', ParseIntPipe) userId: number): Promise<UserProgressSummary> {
        return this.progressService.getUserProgress(userId);
    }

    /**
     * Updates progress for a specific exercise when a student submits an attempt.
     * 
     * @param {number} exerciseId - The exercise ID from URL parameter
     * @param {ExerciseProgressUpdate} progressUpdate - Progress update data with completion status
     * @param {number} userId - The authenticated student's ID from JWT token
     */
    @Post('exercise/:id')
    @Roles('STUDENT')
    async updateExerciseProgress(
        @Param('id', ParseIntPipe) exerciseId: number,
        @Body() progressUpdate: ExerciseProgressUpdate,
        @GetUser('id') userId: number,
    ): Promise<void> {
        return this.progressService.updateExerciseProgress(userId, exerciseId, progressUpdate);
    }
}
