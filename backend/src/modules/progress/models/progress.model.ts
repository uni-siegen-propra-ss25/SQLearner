export interface UserProgressSummary {
    userId: number;
    totalExercises: number;
    completedExercises: number;
    completionPercentage: number;
    chapterProgress: ChapterProgress[];
    difficultyStats: DifficultyStats;
    lastActivityDate: Date | null;
}

export interface ChapterProgress {
    chapterId: number;
    chapterTitle: string;
    totalExercises: number;
    completedExercises: number;
    completionPercentage: number;
    isCompleted: boolean;
}

export interface DifficultyStats {
    easy: ProgressStats;
    medium: ProgressStats;
    hard: ProgressStats;
}

export interface ProgressStats {
    total: number;
    completed: number;
    percentage: number;
}

export interface ExerciseProgressUpdate {
    exerciseId: number;
    isPassed: boolean;
}
