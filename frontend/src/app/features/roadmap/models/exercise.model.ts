export enum ExerciseType {
    SINGLE_CHOICE = 'SINGLE_CHOICE',
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    QUERY = 'QUERY',
    FREETEXT = 'FREETEXT',
}

export enum Difficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
}

export interface Exercise {
    id: number;
    topicId: number;
    title: string;
    description: string;
    type: ExerciseType;
    difficulty: Difficulty;
    order: number;

    // Query specific fields
    database?: {
        id: number;
        name: string;
        description?: string;
        schemaSql?: string;
    };
    databaseId?: number;
    querySolution?: string;

    // Choice specific fields
    answers?: AnswerOption[];

    createdAt: Date;
    updatedAt: Date;
}

export interface AnswerOption {
    id?: number;
    exerciseId: number;
    text: string;
    isCorrect: boolean;
    order: number;
}

export interface Feedback {
    isCorrect: boolean;
    feedback?: string; // LLM-generated feedback
    exerciseId: number;
    userId: number;
}

export interface Bookmark {
    id: number;
    exerciseId: number;
    userId: number;
    createdAt: Date;
}
