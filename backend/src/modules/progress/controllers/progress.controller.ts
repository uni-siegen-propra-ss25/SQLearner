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
     * Retrieves the authenticated student's own progress summary.
     * Returns comprehensive progress data including completion statistics and chapter breakdown.
     * 
     * @param {number} userId - The authenticated user's ID extracted from JWT token
     * @returns {Promise<UserProgressSummary>} Complete progress summary with exercise completion stats, chapter progress, and difficulty breakdown
     * @throws {UnauthorizedException} When user is not authenticated
     * @throws {ForbiddenException} When user role is not STUDENT
     * @throws {NotFoundException} When user with specified ID does not exist
     */
    @Get('user')
    @Roles('STUDENT')
    async getUserProgress(@GetUser('id') userId: number): Promise<UserProgressSummary> {
        return this.progressService.getUserProgress(userId);
    }

    /**
     * Retrieves progress summary for any user by their ID.
     * Allows tutors and admins to view student progress for monitoring and assessment purposes.
     * 
     * @param {number} userId - The target user's ID from URL parameter
     * @returns {Promise<UserProgressSummary>} Complete progress summary with exercise completion stats, chapter progress, and difficulty breakdown
     * @throws {UnauthorizedException} When user is not authenticated
     * @throws {ForbiddenException} When user role is not TUTOR or ADMIN
     * @throws {NotFoundException} When user with specified ID does not exist
     * @throws {BadRequestException} When userId parameter is not a valid integer
     */
    @Get('user/:id')
    @Roles('TUTOR', 'ADMIN')
    async getUserProgressById(@Param('id', ParseIntPipe) userId: number): Promise<UserProgressSummary> {
        return this.progressService.getUserProgress(userId);
    }

    /**
     * Updates progress for a specific exercise when a student submits an attempt.
     * Records attempt count, completion status, and timestamps for learning analytics.
     * 
     * @param {number} exerciseId - The exercise ID from URL parameter
     * @param {ExerciseProgressUpdate} progressUpdate - Progress update data containing completion status
     * @param {number} userId - The authenticated student's ID extracted from JWT token
     * @returns {Promise<void>} Resolves when progress is successfully updated
     * @throws {UnauthorizedException} When user is not authenticated
     * @throws {ForbiddenException} When user role is not STUDENT
     * @throws {NotFoundException} When exercise with specified ID does not exist
     * @throws {BadRequestException} When exerciseId parameter is not a valid integer or request body is invalid
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
