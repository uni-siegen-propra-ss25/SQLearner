import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateThreadDto } from '../models/create-thread.dto';
import { CreateCommentDto } from '../models/create-comment.dto';

/**
 * Service for managing discussion threads and comments.
 * Handles CRUD operations for threads and comments with role-based permissions.
 */
@Injectable()
export class DiscussionsService {
    constructor(private prisma: PrismaService) {}

    /**
     * Retrieves all discussion threads with their metadata
     * @returns Array of discussion threads with comment counts
     */
    async findAllThreads() {
        return this.prisma.discussionThread.findMany({
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }

    /**
     * Retrieves a specific thread by ID
     * @param threadId The ID of the thread to retrieve
     * @returns Thread with author information
     */
    async findThreadById(threadId: number) {
        return this.prisma.discussionThread.findUnique({
            where: { id: threadId },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }

    /**
     * Creates a new discussion thread
     * @param authorId ID of the user creating the thread
     * @param createThreadDto Data for the new thread
     * @returns Created thread with author information
     */
    async createThread(authorId: number, createThreadDto: CreateThreadDto) {
        return this.prisma.discussionThread.create({
            data: {
                title: createThreadDto.title,
                description: createThreadDto.description,
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }

    /**
     * Marks a thread as resolved (only by thread creator or tutors/admins)
     * @param threadId ID of the thread to resolve
     * @param userId ID of the user requesting the action
     * @param isResolved Whether to mark as resolved
     * @returns Updated thread
     */
    async markThreadAsResolved(threadId: number, userId: number, isResolved: boolean) {
        // First verify the user is the thread creator or has tutor/admin privileges
        const thread = await this.prisma.discussionThread.findUnique({
            where: { id: threadId },
            include: {
                author: true,
            },
        });

        if (!thread) {
            throw new Error('Thread not found');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const canResolve = thread.authorId === userId || user.role === 'TUTOR' || user.role === 'ADMIN';
        
        if (!canResolve) {
            throw new Error('Only the thread creator or tutors/admins can mark it as resolved');
        }

        return this.prisma.discussionThread.update({
            where: { id: threadId },
            data: { isResolved },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });
    }

    /**
     * Toggles thread pin status (tutors/admins only)
     * @param threadId ID of the thread to pin/unpin
     * @param isPinned Whether to pin the thread
     * @returns Updated thread
     */
    async toggleThreadPin(threadId: number, isPinned: boolean) {
        return this.prisma.discussionThread.update({
            where: { id: threadId },
            data: { isPinned },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        });
    }

    /**
     * Retrieves all comments for a specific thread
     * @param threadId ID of the thread to get comments for
     * @returns Array of comments with author information
     */
    async findCommentsByThread(threadId: number) {
        return this.prisma.discussionComment.findMany({
            where: { threadId },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Creates a new comment on a thread
     * @param threadId ID of the thread to comment on
     * @param authorId ID of the user creating the comment
     * @param createCommentDto Data for the new comment
     * @returns Created comment with author information
     */
    async createComment(threadId: number, authorId: number, createCommentDto: CreateCommentDto) {
        return this.prisma.discussionComment.create({
            data: {
                content: createCommentDto.content,
                threadId,
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                    },
                },
            },
        });
    }

    /**
     * Deletes a comment (only by comment author or admin)
     * @param commentId ID of the comment to delete
     * @param userId ID of the user requesting deletion
     * @returns Deletion result
     */
    async deleteComment(commentId: number, userId: number) {
        // First verify the user is the comment author or has admin privileges
        const comment = await this.prisma.discussionComment.findUnique({
            where: { id: commentId },
            include: {
                author: true,
            },
        });

        if (!comment) {
            throw new Error('Comment not found');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const canDelete = comment.authorId === userId || user.role === 'ADMIN';
        
        if (!canDelete) {
            throw new Error('Only the comment author or admin can delete comments');
        }

        return this.prisma.discussionComment.delete({
            where: { id: commentId },
        });
    }

    /**
     * Deletes a discussion thread (only by thread creator or admin)
     * @param threadId ID of the thread to delete
     * @param userId ID of the user requesting deletion
     * @returns Deletion result
     */
    async deleteThread(threadId: number, userId: number) {
        // First verify the user is the thread creator or has admin privileges
        const thread = await this.prisma.discussionThread.findUnique({
            where: { id: threadId },
            include: {
                author: true,
            },
        });

        if (!thread) {
            throw new Error('Thread not found');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const canDelete = thread.authorId === userId || user.role === 'ADMIN';
        
        if (!canDelete) {
            throw new Error('Only the thread creator or admin can delete threads');
        }

        // Delete the thread (comments will be cascade deleted due to schema)
        const result = await this.prisma.discussionThread.delete({
            where: { id: threadId },
        });
        
        return result;
    }
}
