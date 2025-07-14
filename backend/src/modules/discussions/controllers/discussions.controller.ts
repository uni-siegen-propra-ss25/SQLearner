import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import { DiscussionsService } from '../services/discussions.service';
import { CreateThreadDto } from '../models/create-thread.dto';
import { CreateCommentDto } from '../models/create-comment.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { Roles } from '../../../common/decorators/role.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';

/**
 * Controller for handling discussion threads and comments.
 * Provides endpoints for creating topics, managing threads, and adding comments.
 */
@Controller('discussions')
@UseGuards(JwtAuthGuard)
export class DiscussionsController {
    constructor(private readonly discussionsService: DiscussionsService) {}

    /**
     * Retrieves all discussion threads
     * @returns Array of discussion threads
     */
    @Get()
    async getThreads() {
        return this.discussionsService.findAllThreads();
    }

    /**
     * Retrieves a specific thread by ID
     * @param threadId ID of the thread to retrieve
     * @returns Discussion thread details
     */
    @Get(':threadId')
    async getThread(@Param('threadId', ParseIntPipe) threadId: number) {
        return this.discussionsService.findThreadById(threadId);
    }

    /**
     * Creates a new discussion thread
     * @param user Current authenticated user
     * @param createThreadDto Thread creation data
     * @returns Created thread
     */
    @Post()
    async createThread(
        @GetUser() user: any,
        @Body() createThreadDto: CreateThreadDto,
    ) {
        return this.discussionsService.createThread(user.id, createThreadDto);
    }

    /**
     * Marks a thread as resolved (only thread creator can do this)
     * @param threadId ID of the thread to resolve
     * @param user Current authenticated user
     * @param body Request body containing resolution status
     * @returns Updated thread
     */
    @Patch(':threadId/resolve')
    async markThreadAsResolved(
        @Param('threadId', ParseIntPipe) threadId: number,
        @GetUser() user: any,
        @Body() body: { isResolved: boolean },
    ) {
        return this.discussionsService.markThreadAsResolved(
            threadId,
            user.id,
            body.isResolved,
        );
    }

    /**
     * Pins or unpins a thread (tutors and admins only)
     * @param threadId ID of the thread to pin/unpin
     * @param body Request body containing pin status
     * @returns Updated thread
     */
    @Patch(':threadId/pin')
    @UseGuards(RolesGuard)
    @Roles('TUTOR', 'ADMIN')
    async toggleThreadPin(
        @Param('threadId', ParseIntPipe) threadId: number,
        @Body() body: { isPinned: boolean },
    ) {
        return this.discussionsService.toggleThreadPin(threadId, body.isPinned);
    }

    /**
     * Retrieves all comments for a specific thread
     * @param threadId ID of the thread to get comments for
     * @returns Array of comments
     */
    @Get(':threadId/comments')
    async getComments(@Param('threadId', ParseIntPipe) threadId: number) {
        return this.discussionsService.findCommentsByThread(threadId);
    }

    /**
     * Adds a new comment to a thread
     * @param threadId ID of the thread to comment on
     * @param user Current authenticated user
     * @param createCommentDto Comment creation data
     * @returns Created comment
     */
    @Post(':threadId/comments')
    async createComment(
        @Param('threadId', ParseIntPipe) threadId: number,
        @GetUser() user: any,
        @Body() createCommentDto: CreateCommentDto,
    ) {
        return this.discussionsService.createComment(
            threadId,
            user.id,
            createCommentDto,
        );
    }

    /**
     * Deletes a comment (only comment author or admin)
     * @param threadId ID of the thread containing the comment
     * @param commentId ID of the comment to delete
     * @param user Current authenticated user
     * @returns Deletion result
     */
    @Delete(':threadId/comments/:commentId')
    async deleteComment(
        @Param('threadId', ParseIntPipe) threadId: number,
        @Param('commentId', ParseIntPipe) commentId: number,
        @GetUser() user: any,
    ) {
        return this.discussionsService.deleteComment(commentId, user.id);
    }

    /**
     * Deletes a discussion thread (only thread creator or admin)
     * @param threadId ID of the thread to delete
     * @param user Current authenticated user
     * @returns Deletion result
     */
    @Delete(':threadId')
    async deleteThread(
        @Param('threadId', ParseIntPipe) threadId: number,
        @GetUser() user: any,
    ) {
        return await this.discussionsService.deleteThread(threadId, user.id);
    }
}
