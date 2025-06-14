import { Injectable, Logger } from '@nestjs/common';
import { QueryExecutorService } from './query-executor.service';
import { ResultComparatorService } from './result-comparator.service';
import { EvaluationResult, EvaluationCategory } from '../models/evaluation-result.dto';
import { SqlEvaluationException } from '../exceptions/sql-evaluation.exception';

/**
 * Main orchestrator service for SQL query evaluation and assessment.
 * Coordinates query execution, result comparison, and feedback generation for student SQL submissions.
 */
@Injectable()
export class SqlEvaluationService {
    private readonly logger = new Logger(SqlEvaluationService.name);

    /**
     * Creates an instance of SqlEvaluationService with required dependencies.
     * @param {QueryExecutorService} queryExecutor - Service for secure SQL query execution
     * @param {ResultComparatorService} resultComparator - Service for result set comparison
     */
    constructor(
        private readonly queryExecutor: QueryExecutorService,
        private readonly resultComparator: ResultComparatorService
    ) {}

    /**
     * Evaluates a student's SQL query against a reference solution.
     * Executes both queries, compares results, and generates comprehensive feedback.
     * 
     * @param {string} studentQuery - The SQL query submitted by the student
     * @param {string} solutionQuery - The reference solution query from the tutor
     * @param {number} databaseId - The ID of the database to execute queries against
     * @returns {Promise<EvaluationResult>} Complete evaluation with correctness, feedback, and suggestions
     * 
     * @description Evaluation process:
     * 1. Executes student and solution queries in parallel
     * 2. Compares result sets for correctness assessment
     * 3. Generates detailed feedback based on differences
     * 4. Categorizes performance and provides improvement suggestions
     * 5. Handles errors gracefully with appropriate feedback
     * 
     * @example
     * ```typescript
     * const evaluation = await sqlEvaluator.evaluateQuery(
     *   "SELECT name FROM users WHERE age > 18",
     *   "SELECT name FROM users WHERE age >= 18",
     *   123
     * );
     * 
     * if (evaluation.isCorrect) {
     *   console.log('Query is correct!');
     * } else {
     *   console.log('Issues found:', evaluation.feedback);
     *   console.log('Suggestions:', evaluation.suggestions);
     * }
     * ```
     */
    async evaluateQuery(
        studentQuery: string,
        solutionQuery: string,
        databaseId: number
    ): Promise<EvaluationResult> {
        this.logger.log(`Starting SQL evaluation for database ${databaseId}`);
        
        try {
            // Execute both queries in parallel
            const [studentResult, solutionResult] = await Promise.all([
                this.queryExecutor.executeQuerySafely(studentQuery, databaseId, 'student'),
                this.queryExecutor.executeQuerySafely(solutionQuery, databaseId, 'solution')
            ]);

            // Compare results
            const comparison = this.resultComparator.compareResults(
                studentResult,
                solutionResult
            );

            // Generate evaluation
            const evaluation = this.generateEvaluation(comparison, studentResult);
            
            this.logger.log(`SQL evaluation completed: ${evaluation.category}`);
            return evaluation;

        } catch (error) {
            this.logger.error(`SQL evaluation failed: ${error.message}`);
            return this.createErrorEvaluation(error);
        }
    }    /**
     * Generates a comprehensive evaluation result based on the comparison analysis.
     * Categorizes the result and provides appropriate feedback messages.
     * 
     * @param {any} comparison - The detailed comparison result from ResultComparatorService
     * @param {any} studentResult - The student's query execution result with performance data
     * @returns {EvaluationResult} Complete evaluation with category, feedback, and technical details
     * 
     * @private
     * @description Evaluation categorization logic:
     * - CORRECT: Perfect match in all aspects
     * - WRONG_COLUMNS: Column structure mismatch
     * - WRONG_ROW_COUNT: Incorrect number of rows
     * - WRONG_DATA: Data content differences
     * 
     * Each category provides specific feedback to help students understand their mistakes.
     */
    private generateEvaluation(
        comparison: any,
        studentResult: any
    ): EvaluationResult {
        let category: EvaluationCategory;
        let feedback: string;
        let isCorrect: boolean;

        if (comparison.isExactMatch) {
            category = EvaluationCategory.CORRECT;
            feedback = 'Richtig! Ihre Query liefert das korrekte Ergebnis.';
            isCorrect = true;
        } else if (!comparison.columnsMatch) {
            category = EvaluationCategory.WRONG_COLUMNS;
            feedback = 'Die Spaltenstruktur ist nicht korrekt.';
            isCorrect = false;
        } else if (!comparison.rowCountMatch) {
            category = EvaluationCategory.WRONG_ROW_COUNT;
            feedback = 'Die Anzahl der Zeilen ist nicht korrekt.';
            isCorrect = false;        } else {
            category = EvaluationCategory.WRONG_DATA;
            feedback = 'Die Daten sind nicht korrekt.';
            isCorrect = false;
        }

        return {
            isCorrect,
            category,
            feedback,
            executionTimeMs: studentResult.executionTimeMs,
            technicalDetails: comparison
        };
    }

    /**
     * Creates an evaluation result for error scenarios.
     * Maps different error types to appropriate categories and user-friendly feedback.
     * 
     * @param {any} error - The error that occurred during query evaluation
     * @returns {EvaluationResult} Evaluation result with error information and feedback
     * 
     * @private
     * @description Error handling covers:
     * - TIMEOUT: Query execution exceeded time limits
     * - FORBIDDEN_OPERATION: Security violations (unsafe SQL operations)
     * - SYNTAX_ERROR: SQL syntax or complexity issues
     * - EXECUTION_ERROR: General execution failures
     * 
     * Provides educational feedback to help students understand and fix their queries.
     */
    private createErrorEvaluation(error: any): EvaluationResult {
        let category: EvaluationCategory;
        let feedback: string;

        if (error instanceof SqlEvaluationException) {
            switch (error.type) {
                case 'TIMEOUT':
                    category = EvaluationCategory.TIMEOUT_ERROR;
                    feedback = 'Ihre Query wurde abgebrochen (Timeout nach 10 Sekunden).';
                    break;
                case 'FORBIDDEN_OPERATION':
                case 'QUERY_TOO_LONG':
                case 'QUERY_TOO_COMPLEX':
                    category = EvaluationCategory.SYNTAX_ERROR;
                    feedback = error.message;
                    break;
                default:
                    category = EvaluationCategory.EXECUTION_ERROR;
                    feedback = `Fehler bei der Ausführung: ${error.message}`;
            }
        } else {
            category = EvaluationCategory.EXECUTION_ERROR;
            feedback = 'Ein unerwarteter Fehler ist aufgetreten.';
        }

        return {
            isCorrect: false,
            category,
            feedback,
            executionTimeMs: 0
        };
    }
}
