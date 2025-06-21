import { ComparisonResult } from './comparison-result.dto';

export interface EvaluationResult {
    isCorrect: boolean;
    category: EvaluationCategory;
    feedback: string;
    executionTimeMs: number;
    technicalDetails?: ComparisonResult;
}

export enum EvaluationCategory {
    CORRECT = 'CORRECT',
    WRONG_COLUMNS = 'WRONG_COLUMNS',
    WRONG_ROW_COUNT = 'WRONG_ROW_COUNT',
    WRONG_DATA = 'WRONG_DATA',
    SYNTAX_ERROR = 'SYNTAX_ERROR',
    EXECUTION_ERROR = 'EXECUTION_ERROR',
    TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}
