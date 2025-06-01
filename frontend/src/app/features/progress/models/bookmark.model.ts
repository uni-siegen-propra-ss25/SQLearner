import { ExerciseType, Difficulty } from '../../roadmap/models/exercise.model';

export interface BookmarkData {
    id: number;
    userId: number;
    exerciseId: number;
    exercise: {
        id: number;
        title: string;
        type: ExerciseType;
        difficulty: Difficulty;
        order: number;
        topic: {
            id: number;
            title: string;
            chapter: {
                id: number;
                title: string;
            };
        };
    };
    createdAt: Date;
}

export interface CreateBookmarkDto {
    exerciseId: number;
}
