import { ExerciseType, Difficulty } from '../../roadmap/models/exercise.model';

/**
 * Represents a user's progress data for a single exercise attempt.
 * @property {number} id - Unique identifier for the progress record
 * @property {number} exerciseId - Unique identifier for the exercise
 * @property {object} exercise - Exercise metadata including title, type, difficulty, and topic/chapter
 * @property {number} attempts - Number of attempts made by the user
 * @property {boolean} isPassed - Whether the user has passed the exercise
 * @property {Date=} passedAt - Date when the exercise was passed (optional)
 * @property {Date} lastAttemptAt - Date of the last attempt
 */
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

/**
 * Represents the progress of a user for a single exercise.
 * @property {number} exerciseId - Unique identifier for the exercise
 * @property {boolean} isPassed - Whether the user has passed the exercise
 */
export interface ExerciseProgress {
    exerciseId: number;
    isPassed: boolean;
}

/**
 * Represents progress statistics for a single chapter.
 * @property {number} chapterId - Unique identifier for the chapter
 * @property {string} chapterTitle - Title of the chapter
 * @property {number} totalExercises - Total number of exercises in the chapter
 * @property {number} completedExercises - Number of completed exercises in the chapter
 * @property {number} completionPercentage - Percentage of completed exercises in the chapter
 * @property {boolean=} isCompleted - Whether the chapter is fully completed (optional)
 * @property {ExerciseProgress[]=} exercises - Optional array of detailed exercise progress for the chapter
 */
export interface ChapterProgress {
    chapterId: number;
    chapterTitle: string;
    totalExercises: number;
    completedExercises: number;
    completionPercentage: number;
    isCompleted?: boolean;
    exercises?: ExerciseProgress[];
}

/**
 * Represents a summary of a user's progress across all exercises and chapters.
 * @property {number=} userId - Unique identifier for the user (optional)
 * @property {number} totalExercises - Total number of exercises available
 * @property {number} completedExercises - Number of exercises the user has completed
 * @property {number} completionPercentage - Percentage of completed exercises
 * @property {ChapterProgress[]} chapterProgress - Array of chapter progress objects
 * @property {object=} difficultyStats - Completion statistics grouped by difficulty (optional)
 * @property {Date | null=} lastActivityDate - Date of the user's last activity or null (optional)
 */
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
