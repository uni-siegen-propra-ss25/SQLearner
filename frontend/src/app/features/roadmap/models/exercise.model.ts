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

export interface Submission {
    id: number;
    exerciseId: number;
    userId: number;
    answerText: string; // SQL query, chosen option IDs, or free text
    isCorrect: boolean;
    feedback?: string; // LLM-generated feedback
    createdAt: Date;
}

export interface Bookmark {
    id: number;
    exerciseId: number;
    userId: number;
    createdAt: Date;
}
