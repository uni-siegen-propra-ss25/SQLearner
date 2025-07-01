export interface ExerciseProgressDto {
  exerciseId: number;
  isPassed: boolean;
  attempts?: number;
  lastAttemptAt?: Date;
  passedAt?: Date;
}

export interface ChapterProgressDto {
  chapterId: number;
  chapterTitle: string;
  totalExercises: number;
  completedExercises: number;
  completionPercentage: number;
  exercises: ExerciseProgressDto[]; // <-- Das fehlende Feld!
}

export interface UserProgressSummaryDto {
  userId?: number;
  totalExercises: number;
  completedExercises: number;
  completionPercentage: number;
  chapterProgress: ChapterProgressDto[];
  difficultyStats?: {
    easy: { completed: number, total: number, percentage: number },
    medium: { completed: number, total: number, percentage: number },
    hard: { completed: number, total: number, percentage: number }
  };
  lastActivityDate?: Date | null;
}
