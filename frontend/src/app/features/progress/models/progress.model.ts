import { ExerciseType, Difficulty } from '../../roadmap/models/exercise.model';

export interface ProgressData {
    id: number;
    exerciseId: number;
    exercise: {
        id: number;
        title: string;
        type: ExerciseType;
        difficulty: Difficulty;
        topic: {
            id: number;
            title: string;
            chapter: {
                id: number;
                title: string;
            };
        };
    };
    attempts: number;
    isPassed: boolean;
    passedAt?: Date;
    lastAttemptAt: Date;
}

export interface ChapterProgress {
    chapterId: number;
    chapterTitle: string;
    totalExercises: number;
    completedExercises: number;
    completionPercentage: number;
    isCompleted?: boolean;
    exercises?: ProgressData[];
}

export interface UserProgressSummary {
    userId?: number;
    totalExercises: number;
    completedExercises: number;
    completionPercentage: number; // Geändert von totalProgressPercentage
    chapterProgress: ChapterProgress[];
    difficultyStats?: {
        easy: { completed: number, total: number, percentage: number },
        medium: { completed: number, total: number, percentage: number },
        hard: { completed: number, total: number, percentage: number }
    };
    lastActivityDate?: Date | null;
}
