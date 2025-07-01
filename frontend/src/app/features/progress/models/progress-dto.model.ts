/**
 * Unified Progress DTO for consistent progress tracking across all components.
 * Provides simplified interface for exercise completion status without complex nesting.
 */
export interface ProgressDto {
    /**
     * Array of all exercise IDs that the user has successfully completed.
     * Used for O(1) lookup of completion status across roadmap and progress views.
     */
    completedExerciseIds: number[];
    
    /**
     * Total number of exercises available in the system.
     * Used for calculating overall progress percentages.
     */
    totalCount: number;
    
    /**
     * Optional breakdown by chapter for detailed progress display.
     */
    chapterProgress?: {
        chapterId: number;
        chapterTitle: string;
        completedExerciseIds: number[];
        totalExercises: number;
    }[];
}
