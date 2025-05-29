import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserProgressSummary, ChapterProgress, DifficultyStats, ExerciseProgressUpdate } from '../models/progress.model';

@Injectable()
export class ProgressService {
    constructor(private readonly prisma: PrismaService) {}

    async getUserProgress(userId: number): Promise<UserProgressSummary> {
        // Verify user exists
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${userId} not found`);
        }        // Get all exercises with user progress
        const exercises = await this.prisma.exercise.findMany({
            include: {
                Progress: {
                    where: { userId },
                },
                topic: {
                    include: {
                        chapter: true,
                    },
                },
            },
        });        // Calculate total statistics
        const totalExercises = exercises.length;
        const completedExercises = exercises.filter(ex => 
            ex.Progress.length > 0 && ex.Progress[0].isPassed
        ).length;
        const completionPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

        // Calculate chapter progress
        const chapterProgress = await this.calculateChapterProgress(exercises);

        // Calculate difficulty statistics
        const difficultyStats = this.calculateDifficultyStats(exercises);        // Get last activity date
        const lastActivity = await this.prisma.progress.findFirst({
            where: { userId },
            orderBy: { lastAttemptAt: 'desc' },
        });

        return {
            userId,
            totalExercises,
            completedExercises,
            completionPercentage,
            chapterProgress,
            difficultyStats,
            lastActivityDate: lastActivity?.lastAttemptAt || null,
        };
    }

    async updateExerciseProgress(
        userId: number, 
        exerciseId: number, 
        progressUpdate: ExerciseProgressUpdate
    ): Promise<void> {
        // Verify exercise exists
        const exercise = await this.prisma.exercise.findUnique({
            where: { id: exerciseId },
        });

        if (!exercise) {
            throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
        }        // Upsert progress record
        await this.prisma.progress.upsert({
            where: {
                userId_exerciseId: {
                    userId,
                    exerciseId,
                },
            },
            update: {
                isPassed: progressUpdate.isPassed,
                attempts: { increment: 1 },
                passedAt: progressUpdate.isPassed ? new Date() : null,
            },
            create: {
                userId,
                exerciseId,
                isPassed: progressUpdate.isPassed,
                attempts: 1,
                passedAt: progressUpdate.isPassed ? new Date() : null,
            },
        });
    }

    private async calculateChapterProgress(exercises: any[]): Promise<ChapterProgress[]> {
        const chapterMap = new Map<number, {
            chapter: any;
            total: number;
            completed: number;
        }>();

        // Group exercises by chapter
        exercises.forEach(exercise => {
            const chapter = exercise.topic.chapter;
            const chapterId = chapter.id;
            
            if (!chapterMap.has(chapterId)) {
                chapterMap.set(chapterId, {
                    chapter,
                    total: 0,
                    completed: 0,
                });
            }

            const chapterData = chapterMap.get(chapterId)!;
            chapterData.total++;
              if (exercise.Progress.length > 0 && exercise.Progress[0].isPassed) {
                chapterData.completed++;
            }
        });

        // Convert to ChapterProgress array
        return Array.from(chapterMap.values()).map(({ chapter, total, completed }) => ({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            totalExercises: total,
            completedExercises: completed,
            completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
            isCompleted: completed === total && total > 0,
        }));
    }

    private calculateDifficultyStats(exercises: any[]): DifficultyStats {
        const stats = {
            easy: { total: 0, completed: 0, percentage: 0 },
            medium: { total: 0, completed: 0, percentage: 0 },
            hard: { total: 0, completed: 0, percentage: 0 },
        };        exercises.forEach(exercise => {
            const difficulty = exercise.difficulty?.toLowerCase() || 'medium';
            const isCompleted = exercise.Progress.length > 0 && exercise.Progress[0].isPassed;

            if (stats[difficulty]) {
                stats[difficulty].total++;
                if (isCompleted) {
                    stats[difficulty].completed++;
                }
            }
        });

        // Calculate percentages
        Object.keys(stats).forEach(difficulty => {
            const stat = stats[difficulty];
            stat.percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
        });

        return stats;
    }
}
