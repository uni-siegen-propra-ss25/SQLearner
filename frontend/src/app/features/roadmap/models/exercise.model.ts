export enum ExerciseType {
  SQL = 'SQL',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT = 'TEXT'
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export interface Exercise {
  id: number;
  topicId: number;
  type: ExerciseType;
  title: string;
  description: string;
  difficulty: Difficulty;
  order: number;
  llmPrompt?: string;
  sqlSolution?: string;
  choices?: {
    text: string;
    isCorrect: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
} 