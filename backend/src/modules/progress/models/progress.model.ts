/**
 * Represents a summary of a user's progress across all exercises and chapters.
 * @property {number} userId - The unique identifier of the user
 * @property {number} totalExercises - Total number of exercises available
 * @property {number} completedExercises - Number of exercises the user has completed
 * @property {number} completionPercentage - Percentage of completed exercises
 * @property {ChapterProgress[]} chapterProgress - Array of chapter progress objects
 * @property {DifficultyStats} difficultyStats - Completion statistics grouped by difficulty
 * @property {Date | null} lastActivityDate - Date of the user's last activity or null if none
 */
export interface UserProgressSummary {
    userId: number;
    totalExercises: number;
    completedExercises: number;
    completionPercentage: number;
    chapterProgress: ChapterProgress[];
    difficultyStats: DifficultyStats;
    lastActivityDate: Date | null;
}

/**
 * Represents progress statistics for a single chapter.
 * @property {number} chapterId - The unique identifier of the chapter
 * @property {string} chapterTitle - The title of the chapter
 * @property {number} totalExercises - Total number of exercises in the chapter
 * @property {number} completedExercises - Number of completed exercises in the chapter
 * @property {number} completionPercentage - Percentage of completed exercises in the chapter
 * @property {boolean} isCompleted - Whether the chapter is fully completed
 * @property {ExerciseProgress[]=} exercises - Optional array of detailed exercise progress for the chapter
 */
export interface ChapterProgress {
    chapterId: number;
    chapterTitle: string;
    totalExercises: number;
    completedExercises: number;
    completionPercentage: number;
    isCompleted: boolean;
    exercises?: ExerciseProgress[]; // Added for detailed exercise tracking
}

/**
 * Represents the progress of a user for a single exercise.
 * @property {number} exerciseId - The unique identifier of the exercise
 * @property {boolean} isPassed - Whether the user has passed the exercise
 */
export interface ExerciseProgress {
    exerciseId: number;
    isPassed: boolean;
}

/**
 * Represents completion statistics grouped by exercise difficulty level.
 * @property {ProgressStats} easy - Statistics for easy exercises
 * @property {ProgressStats} medium - Statistics for medium exercises
 * @property {ProgressStats} hard - Statistics for hard exercises
 */
export interface DifficultyStats {
    easy: ProgressStats;
    medium: ProgressStats;
    hard: ProgressStats;
}

/**
 * Represents statistics for a group of exercises (e.g., by difficulty).
 * @property {number} total - Total number of exercises in the group
 * @property {number} completed - Number of completed exercises in the group
 * @property {number} percentage - Percentage of completed exercises in the group
 */
export interface ProgressStats {
    total: number;
    completed: number;
    percentage: number;
}

/**
 * Represents an update to a user's progress for a specific exercise.
 * @property {number} exerciseId - The unique identifier of the exercise
 * @property {boolean} isPassed - Whether the user has passed the exercise
 */
export interface ExerciseProgressUpdate {
    exerciseId: number;
    isPassed: boolean;
}
