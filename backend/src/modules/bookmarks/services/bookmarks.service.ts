import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BookmarkData } from '../models/bookmark.model';

@Injectable()
export class BookmarksService {
    constructor(private readonly prisma: PrismaService) {}

    async getUserBookmarks(userId: number): Promise<BookmarkData[]> {
        const bookmarks = await this.prisma.bookmark.findMany({
            where: { userId },
            include: {
                exercise: {
                    include: {
                        topic: {
                            include: {
                                chapter: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });        return bookmarks.map(bookmark => ({
            id: bookmark.id,
            userId: bookmark.userId,
            exerciseId: bookmark.exerciseId,
            exercise: {
                id: bookmark.exercise.id,
                title: bookmark.exercise.title,
                type: bookmark.exercise.type,
                difficulty: bookmark.exercise.difficulty,
                order: bookmark.exercise.order,
                topic: {
                    id: bookmark.exercise.topic.id,
                    title: bookmark.exercise.topic.title,
                    chapter: {
                        id: bookmark.exercise.topic.chapter.id,
                        title: bookmark.exercise.topic.chapter.title,
                    },
                },
            },
            createdAt: bookmark.createdAt,
        }));
    }

    async createBookmark(userId: number, exerciseId: number): Promise<BookmarkData> {
        // Verify exercise exists
        const exercise = await this.prisma.exercise.findUnique({
            where: { id: exerciseId },
            include: {
                topic: {
                    include: {
                        chapter: true,
                    },
                },
            },
        });

        if (!exercise) {
            throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
        }

        // Check if bookmark already exists
        const existingBookmark = await this.prisma.bookmark.findUnique({
            where: {
                userId_exerciseId: {
                    userId,
                    exerciseId,
                },
            },
        });

        if (existingBookmark) {
            throw new ConflictException('Exercise is already bookmarked');
        }

        // Create bookmark
        const bookmark = await this.prisma.bookmark.create({
            data: {
                userId,
                exerciseId,
            },
            include: {
                exercise: {
                    include: {
                        topic: {
                            include: {
                                chapter: true,
                            },
                        },
                    },
                },
            },
        });        return {
            id: bookmark.id,
            userId: bookmark.userId,
            exerciseId: bookmark.exerciseId,
            exercise: {
                id: bookmark.exercise.id,
                title: bookmark.exercise.title,
                type: bookmark.exercise.type,
                difficulty: bookmark.exercise.difficulty,
                order: bookmark.exercise.order,
                topic: {
                    id: bookmark.exercise.topic.id,
                    title: bookmark.exercise.topic.title,
                    chapter: {
                        id: bookmark.exercise.topic.chapter.id,
                        title: bookmark.exercise.topic.chapter.title,
                    },
                },
            },
            createdAt: bookmark.createdAt,
        };
    }

    async removeBookmark(bookmarkId: number, userId: number): Promise<void> {
        // Find bookmark and verify ownership
        const bookmark = await this.prisma.bookmark.findUnique({
            where: { id: bookmarkId },
        });

        if (!bookmark) {
            throw new NotFoundException(`Bookmark with ID ${bookmarkId} not found`);
        }

        if (bookmark.userId !== userId) {
            throw new ForbiddenException('You can only remove your own bookmarks');
        }

        // Remove bookmark
        await this.prisma.bookmark.delete({
            where: { id: bookmarkId },
        });
    }
}
