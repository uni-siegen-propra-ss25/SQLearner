import { Injectable, Logger } from '@nestjs/common';
import { QueryResult } from '../models/query-result.dto';
import { ComparisonResult, ComparisonDifference } from '../models/comparison-result.dto';

/**
 * Service responsible for comparing SQL query results to determine correctness and provide detailed feedback.
 * Performs normalized, deterministic comparison between student queries and reference solutions.
 */
@Injectable()
export class ResultComparatorService {
    private readonly logger = new Logger(ResultComparatorService.name);

    /**
     * Compares student query results with expected reference results to determine correctness.
     * Provides detailed analysis including column structure, row count, and data accuracy.
     * 
     * @param {QueryResult} studentResult - The result from executing the student's SQL query
     * @param {QueryResult} expectedResult - The reference result from the tutor's solution query
     * @returns {ComparisonResult} Comprehensive comparison analysis with match status and differences
     * 
     * @description Comparison process includes:
     * - Column name and order validation
     * - Row count verification
     * - Cell-by-cell data comparison with normalization
     * - Accuracy scoring and detailed difference reporting
     * 
     * @example
     * ```typescript
     * const comparison = comparator.compareResults(studentResult, expectedResult);
     * if (comparison.isExactMatch) {
     *   console.log('Perfect match!');
     * } else {
     *   console.log(`Data accuracy: ${comparison.dataAccuracy * 100}%`);
     *   console.log('Differences:', comparison.differences);
     * }
     * ```
     */
    compareResults(
        studentResult: QueryResult,
        expectedResult: QueryResult
    ): ComparisonResult {
        this.logger.debug('Starting result comparison');
        
        const differences: ComparisonDifference[] = [];
        
        // 1. Compare columns
        const columnsMatch = this.compareColumns(
            studentResult,
            expectedResult,
            differences
        );
        
        // 2. Compare row count
        const rowCountMatch = this.compareRowCount(
            studentResult,
            expectedResult,
            differences
        );
        
        // 3. Compare data (only if structure matches)
        let dataAccuracy = 0;
        if (columnsMatch && rowCountMatch) {
            dataAccuracy = this.compareData(
                studentResult,
                expectedResult,
                differences
            );
        }
        
        const isExactMatch = columnsMatch && rowCountMatch && dataAccuracy === 1.0;
        
        this.logger.debug(`Comparison complete: match=${isExactMatch}, columns=${columnsMatch}, rows=${rowCountMatch}, accuracy=${dataAccuracy}`);
        
        return {
            isExactMatch,
            columnsMatch,
            rowCountMatch,
            dataAccuracy,
            differences
        };
    }    /**
     * Compares column structure between student and expected results.
     * Validates column names, count, and order with normalization for case-insensitive comparison.
     * 
     * @param {QueryResult} studentResult - Student's query result
     * @param {QueryResult} expectedResult - Expected reference result
     * @param {ComparisonDifference[]} differences - Array to collect identified differences
     * @returns {boolean} True if column structures match exactly
     * 
     * @private
     * @description Column comparison includes:
     * - Column count validation
     * - Case-insensitive name comparison
     * - Order verification
     * - Detailed difference reporting for mismatches
     */
    private compareColumns(
        studentResult: QueryResult,
        expectedResult: QueryResult,
        differences: ComparisonDifference[]
    ): boolean {
        const studentColumns = this.normalizeColumns(studentResult.columns);
        const expectedColumns = this.normalizeColumns(expectedResult.columns);
        
        if (studentColumns.length !== expectedColumns.length) {
            differences.push({
                type: 'COLUMN_MISMATCH',
                description: `Column count mismatch. Expected ${expectedColumns.length}, got ${studentColumns.length}`,
                expected: expectedColumns,
                actual: studentColumns
            });
            return false;
        }
        
        for (let i = 0; i < expectedColumns.length; i++) {
            if (studentColumns[i] !== expectedColumns[i]) {
                differences.push({
                    type: 'COLUMN_MISMATCH',
                    description: `Column name mismatch at position ${i + 1}. Expected '${expectedColumns[i]}', got '${studentColumns[i]}'`,
                    expected: expectedColumns[i],
                    actual: studentColumns[i],
                    position: { column: `position_${i + 1}` }
                });
                return false;
            }
        }
        
        return true;
    }    /**
     * Compares row counts between student and expected results.
     * Ensures the query returns the correct number of rows by comparing actual array lengths.
     * 
     * @param {QueryResult} studentResult - Student's query result
     * @param {QueryResult} expectedResult - Expected reference result
     * @param {ComparisonDifference[]} differences - Array to collect identified differences
     * @returns {boolean} True if row counts match exactly
     * 
     * @private
     * @description Row count validation is critical for:
     * - Ensuring correct filtering conditions (WHERE clauses)
     * - Validating aggregation results (GROUP BY, HAVING)
     * - Confirming join operations produce expected result sets
     * - Uses actual array length for consistency with data comparison
     */
    private compareRowCount(
        studentResult: QueryResult,
        expectedResult: QueryResult,
        differences: ComparisonDifference[]
    ): boolean {
        // Use actual array length instead of stored rowCount for consistency
        const studentRowCount = studentResult.rows.length;
        const expectedRowCount = expectedResult.rows.length;
        
        if (studentRowCount !== expectedRowCount) {
            differences.push({
                type: 'ROW_COUNT_MISMATCH',
                description: `Row count mismatch. Expected ${expectedRowCount}, got ${studentRowCount}`,
                expected: expectedRowCount,
                actual: studentRowCount
            });
            return false;
        }
        
        return true;
    }/**
     * Compares the actual data content between student and expected results.
     * Performs cell-by-cell comparison with normalization and calculates accuracy percentage.
     * 
     * @param {QueryResult} studentResult - Student's query result
     * @param {QueryResult} expectedResult - Expected reference result
     * @param {ComparisonDifference[]} differences - Array to collect identified differences
     * @returns {number} Data accuracy as a decimal between 0.0 and 1.0 (0% to 100%)
     * 
     * @private
     * @description Data comparison process:
     * - Normalizes both result sets for consistent comparison
     * - Compares each row and cell systematically
     * - Reports the first difference found per row
     * - Calculates overall accuracy percentage
     * - Handles various data types with appropriate normalization
     */
    private compareData(
        studentResult: QueryResult,
        expectedResult: QueryResult,
        differences: ComparisonDifference[]
    ): number {
        const normalizedStudent = this.normalizeResultSet(studentResult);
        const normalizedExpected = this.normalizeResultSet(expectedResult);
        
        let matchingRows = 0;
        const totalRows = normalizedExpected.rows.length;
        
        for (let i = 0; i < totalRows; i++) {
            const studentRow = normalizedStudent.rows[i];
            const expectedRow = normalizedExpected.rows[i];
            
            if (this.rowsMatch(studentRow, expectedRow, normalizedExpected.columns)) {
                matchingRows++;
            } else {
                // Find first differing value for error message
                for (const column of normalizedExpected.columns) {
                    if (studentRow[column] !== expectedRow[column]) {
                        differences.push({
                            type: 'DATA_MISMATCH',
                            description: `Data mismatch in row ${i + 1}, column '${column}'`,
                            expected: expectedRow[column],
                            actual: studentRow[column],
                            position: { row: i + 1, column }
                        });
                        break; // Only report first difference per row
                    }
                }
            }
        }
        
        return totalRows > 0 ? matchingRows / totalRows : 1;
    }

    /**
     * Normalizes column names for consistent comparison.
     * Converts to lowercase and trims whitespace to handle case variations.
     * 
     * @param {string[]} columns - Array of column names to normalize
     * @returns {string[]} Normalized column names
     * 
     * @private
     * @description This normalization allows for case-insensitive column comparison,
     * which is important since SQL is generally case-insensitive for identifiers.
     */
    private normalizeColumns(columns: string[]): string[] {
        return columns.map(col => col.toLowerCase().trim());
    }    /**
     * Normalizes an entire result set for deterministic comparison.
     * Applies normalization to columns, values, and sorts rows for consistent ordering.
     * 
     * @param {QueryResult} result - The query result to normalize
     * @returns {object} Normalized result with columns and rows
     * @returns {string[]} returns.columns - Normalized column names
     * @returns {Record<string, any>[]} returns.rows - Normalized and sorted rows
     * 
     * @private
     * @description Normalization ensures:
     * - Case-insensitive column comparison
     * - Consistent value formatting (strings, numbers, dates, nulls)
     * - Deterministic row ordering through sorting
     * - Handling of floating-point precision issues
     */
    private normalizeResultSet(result: QueryResult): {
        columns: string[];
        rows: Record<string, any>[];
    } {
        const normalizedColumns = this.normalizeColumns(result.columns);
        
        // Normalize rows
        const normalizedRows = result.rows.map(row => {
            const normalizedRow: Record<string, any> = {};
            
            for (const [key, value] of Object.entries(row)) {
                const normalizedKey = key.toLowerCase().trim();
                normalizedRow[normalizedKey] = this.normalizeValue(value);
            }
            
            return normalizedRow;
        });

        // Sort rows for deterministic comparison
        normalizedRows.sort((a, b) => {
            return JSON.stringify(a).localeCompare(JSON.stringify(b));
        });

        return {
            columns: normalizedColumns,
            rows: normalizedRows
        };
    }

    /**
     * Normalizes individual values for consistent comparison across different data types.
     * Handles edge cases like null values, floating-point precision, and date formatting.
     * 
     * @param {any} value - The value to normalize
     * @returns {any} The normalized value ready for comparison
     * 
     * @private
     * @description Value normalization handles:
     * - Null and undefined values → standardized null
     * - String values → trimmed whitespace
     * - Number values → floating-point precision rounding
     * - Date values → ISO string format
     * - Other types → returned as-is
     */
    private normalizeValue(value: any): any {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === 'string') {
            return value.trim();
        }

        if (typeof value === 'number') {
            // Handle floating point precision
            return Number.isInteger(value) ? value : Math.round(value * 1000000) / 1000000;
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        return value;
    }    /**
     * Compares two normalized rows to determine if they match exactly.
     * Performs column-by-column comparison using the specified column order.
     * 
     * @param {Record<string, any>} studentRow - The normalized student result row
     * @param {Record<string, any>} expectedRow - The normalized expected result row
     * @param {string[]} columns - Array of column names to compare
     * @returns {boolean} True if all values in the row match exactly
     * 
     * @private
     * @description This method performs the final comparison step after normalization,
     * ensuring that every cell in the row matches the expected value exactly.
     */
    private rowsMatch(
        studentRow: Record<string, any>,
        expectedRow: Record<string, any>,
        columns: string[]
    ): boolean {
        for (const column of columns) {
            if (studentRow[column] !== expectedRow[column]) {
                return false;
            }
        }
        return true;
    }
}
