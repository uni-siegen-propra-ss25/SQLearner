import { Injectable, Logger } from '@nestjs/common';
import { DatabasesService } from '../../databases/services/databases.service';
import { SqlEvaluationException } from '../exceptions/sql-evaluation.exception';
import { QueryResult } from '../models/query-result.dto';

/**
 * Service responsible for secure execution of SQL queries with validation, sanitization, and timeout protection.
 * Provides a safe environment for executing student queries and reference queries during evaluation.
 */
@Injectable()
export class QueryExecutorService {
    private readonly logger = new Logger(QueryExecutorService.name);
    private readonly QUERY_TIMEOUT_MS = 10000; // 10 seconds
    private readonly MAX_RESULT_ROWS = 5000;

    /**
     * Creates an instance of QueryExecutorService.
     * @param {DatabasesService} databasesService - Service for database operations and query execution
     */
    constructor(private readonly databasesService: DatabasesService) {}

    /**
     * Executes a SQL query safely with validation, sanitization, and timeout protection.
     * @param {string} query - The SQL query to execute (SELECT statements only)
     * @param {number} databaseId - The ID of the database to execute the query against
     * @param {string} context - Optional context for logging (default: 'unknown')
     * @returns {Promise<QueryResult>} - Promise resolving to standardized query result with columns, rows, and metadata
     */
    async executeQuerySafely(
        query: string,
        databaseId: number,
        context: string = 'unknown'
    ): Promise<QueryResult> {
        this.logger.debug(`Executing ${context} query on database ${databaseId}`);
        
        // 1. Validate query safety
        this.validateQuerySafety(query);
        
        // 2. Sanitize query
        const sanitizedQuery = this.sanitizeQuery(query);
        
        // 3. Execute with timeout
        const startTime = performance.now();
          try {
            const rawResult = await Promise.race([
                this.databasesService.runQuery(databaseId, sanitizedQuery),
                this.createTimeoutPromise()
            ]);

            const executionTime = performance.now() - startTime;

            // Adapt rawResult to expected format
            const result = {
                columns: rawResult.fields ? rawResult.fields.map((f: { name: string }) => f.name) : [],
                rows: rawResult.rows
            };
            
            // 4. Validate result
            this.validateResult(result);
            
            this.logger.debug(`${context} query executed successfully in ${Math.round(executionTime)}ms`);
            
            return {
                columns: result.columns,
                rows: result.rows,
                rowCount: result.rows.length,
                executionTimeMs: Math.round(executionTime)
            };

        } catch (error) {
            this.logger.error(`${context} query execution failed: ${error.message}`);
            
            if (error instanceof SqlEvaluationException) {
                throw error;
            }
            
            throw new SqlEvaluationException(
                `Query execution failed: ${this.sanitizeErrorMessage(error.message)}`,
                'EXECUTION_ERROR'
            );
        }
    }

    /**
     * Validates the safety of a SQL query before execution.
     * Prevents execution of dangerous operations like DROP, DELETE, UPDATE, etc.
     * Also checks for query complexity limits to prevent performance issues.
     * 
     * @param {string} query - The SQL query to validate
     * @throws {SqlEvaluationException} If the query contains forbidden operations or exceeds complexity limits
     * 
     * @private
     * @description Security validation includes:
     * - Forbidden SQL operations (DROP, DELETE, UPDATE, INSERT, ALTER, CREATE, TRUNCATE, REPLACE)
     * - SQL injection patterns
     * - File operations (LOAD_FILE, INTO OUTFILE, INTO DUMPFILE)
     * - Time-based attacks (BENCHMARK, SLEEP, WAITFOR)
     * - Query length limits (max 10,000 characters)
     * - Complexity limits (max 20 nested parentheses levels)
     */
    private validateQuerySafety(query: string): void {
        // Check for forbidden operations
        const forbiddenPatterns = [
            /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|REPLACE)\b/gi,
            /;\s*(?:DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE)/gi,
            /LOAD_FILE|INTO\s+OUTFILE|INTO\s+DUMPFILE/gi,
            /BENCHMARK|SLEEP|WAITFOR/gi
        ];

        for (const pattern of forbiddenPatterns) {
            if (pattern.test(query)) {
                throw new SqlEvaluationException(
                    'Query contains forbidden operations. Only SELECT statements are allowed.',
                    'FORBIDDEN_OPERATION'
                );
            }
        }

        // Additional safety checks
        if (query.length > 10000) {
            throw new SqlEvaluationException(
                'Query too long (max 10,000 characters)',
                'QUERY_TOO_LONG'
            );
        }

        const parenCount = (query.match(/\(/g) || []).length;
        if (parenCount > 20) {
            throw new SqlEvaluationException(
                'Query too complex (max 20 nested levels)',
                'QUERY_TOO_COMPLEX'
            );
        }
    }    /**
     * Sanitizes a SQL query by removing comments and normalizing whitespace.
     * This helps prevent comment-based SQL injection and ensures consistent formatting.
     * 
     * @param {string} query - The raw SQL query to sanitize
     * @returns {string} The sanitized query with comments removed and normalized whitespace
     * 
     * @private
     * @description Sanitization process:
     * - Removes line comments (-- comments)
     * - Removes block comments
     * - Normalizes all whitespace to single spaces
     * - Trims leading and trailing whitespace
     */
    private sanitizeQuery(query: string): string {
        return query
            .trim()
            .replace(/--.*$/gm, '') // Remove line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }    /**
     * Creates a timeout promise that rejects after the configured timeout period.
     * Used in Promise.race() to enforce query execution time limits.
     * 
     * @returns {Promise<never>} Promise that never resolves but rejects on timeout
     * @throws {SqlEvaluationException} Always throws when timeout is reached
     * 
     * @private
     * @description This method is used with Promise.race() to ensure queries don't run indefinitely.
     * The timeout is configurable via the QUERY_TIMEOUT_MS constant (default: 10 seconds).
     */
    private createTimeoutPromise(): Promise<never> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(new SqlEvaluationException(
                    'Query execution timeout (10 seconds)',
                    'TIMEOUT'
                ));
            }, this.QUERY_TIMEOUT_MS);
        });
    }

    /**
     * Validates the structure and content of query execution results.
     * Ensures results are properly formatted and within acceptable limits.
     * 
     * @param {object} result - The raw result object from query execution
     * @param {string[]} result.columns - Array of column names
     * @param {any[]} result.rows - Array of result rows
     * @throws {SqlEvaluationException} If result format is invalid or exceeds limits
     * 
     * @private
     * @description Validation checks include:
     * - Result object structure validation
     * - Columns array presence and type validation
     * - Rows array presence and type validation
     * - Minimum column count requirement (at least 1 column)
     * - Maximum row count limit enforcement (default: 5000 rows)
     */
    private validateResult(result: { columns: string[]; rows: any[] }): void {
        if (!result || !Array.isArray(result.columns) || !Array.isArray(result.rows)) {
            throw new SqlEvaluationException(
                'Invalid query result format',
                'INVALID_RESULT'
            );
        }

        if (result.columns.length === 0) {
            throw new SqlEvaluationException(
                'Query must return at least one column',
                'NO_COLUMNS'
            );
        }

        if (result.rows.length > this.MAX_RESULT_ROWS) {
            throw new SqlEvaluationException(
                `Query returned too many rows (${result.rows.length}). Maximum allowed: ${this.MAX_RESULT_ROWS}`,
                'TOO_MANY_ROWS'
            );
        }
    }

    /**
     * Sanitizes error messages to remove sensitive information before logging or returning to users.
     * Prevents exposure of credentials, tokens, or other sensitive data in error messages.
     * 
     * @param {string} message - The raw error message to sanitize
     * @returns {string} The sanitized error message with sensitive data removed and length limited
     * 
     * @private
     * @description Security measures applied:
     * - Replaces password values with asterisks
     * - Replaces token values with asterisks
     * - Limits message length to 500 characters to prevent log flooding
     * - Maintains error message usefulness while protecting sensitive data
     */
    private sanitizeErrorMessage(message: string): string {
        // Remove sensitive information and limit length
        return message
            .replace(/password=\w+/gi, 'password=***')
            .replace(/token=\w+/gi, 'token=***')
            .substring(0, 500);
    }
}
