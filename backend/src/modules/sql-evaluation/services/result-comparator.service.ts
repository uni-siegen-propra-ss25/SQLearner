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
     * const comparison = comparator.compareResults(studentResult, expectedResult);     * if (comparison.isExactMatch) {
     *   console.log('Perfect match!');
     * } else {
     *   console.log('Data matches:', comparison.dataMatches);
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
        let dataMatches = false;
        if (columnsMatch && rowCountMatch) {
            dataMatches = this.compareData(
                studentResult,
                expectedResult,
                differences
            );
        }
        
        const isExactMatch = columnsMatch && rowCountMatch && dataMatches;
        
        this.logger.debug(`Comparison complete: match=${isExactMatch}, columns=${columnsMatch}, rows=${rowCountMatch}, data=${dataMatches}`);
        
        return {
            isExactMatch,
            columnsMatch,
            rowCountMatch,
            dataMatches,
            differences
        };
    }    /**
     * Compares column structure between student and expected results.
     * Validates column names and count with normalization for case-insensitive comparison.
     * Column order is ignored - only the presence of required columns matters.
     * 
     * @param {QueryResult} studentResult - Student's query result
     * @param {QueryResult} expectedResult - Expected reference result
     * @param {ComparisonDifference[]} differences - Array to collect identified differences
     * @returns {boolean} True if column structures match (order independent)
     * 
     * @private
     * @description Column comparison includes:
     * - Column count validation
     * - Case-insensitive name comparison (order independent)
     * - Duplicate column detection
     * - Missing/extra column identification
     * - Detailed difference reporting for mismatches
     */private compareColumns(
        studentResult: QueryResult,
        expectedResult: QueryResult,
        differences: ComparisonDifference[]
    ): boolean {
        const studentColumns = this.normalizeColumns(studentResult.columns);
        const expectedColumns = this.normalizeColumns(expectedResult.columns);
        
        // Set-based comparison to ignore column order
        const studentSet = new Set(studentColumns);
        const expectedSet = new Set(expectedColumns);
        
        // Check column count
        if (studentColumns.length !== expectedColumns.length) {
            differences.push({
                type: 'COLUMN_MISMATCH',
                description: `Column count mismatch. Expected ${expectedColumns.length}, got ${studentColumns.length}`,
                expected: expectedColumns,
                actual: studentColumns
            });
            return false;
        }
          // Check for duplicate columns in either result
        if (this.hasDuplicateColumns(studentColumns) || this.hasDuplicateColumns(expectedColumns)) {
            const duplicateSource = this.hasDuplicateColumns(studentColumns) ? 'student' : 'expected';
            differences.push({
                type: 'COLUMN_MISMATCH',
                description: `Duplicate columns detected in ${duplicateSource} result`,
                expected: expectedColumns,
                actual: studentColumns
            });
            return false;
        }
        
        // Find missing and extra columns
        const missingColumns = expectedColumns.filter(col => !studentSet.has(col));
        const extraColumns = studentColumns.filter(col => !expectedSet.has(col));
          if (missingColumns.length > 0 || extraColumns.length > 0) {
            let description: string;
            if (missingColumns.length > 0 && extraColumns.length === 0) {
                description = `Missing columns: [${missingColumns.join(', ')}]`;
            } else if (extraColumns.length > 0 && missingColumns.length === 0) {
                description = `Extra columns: [${extraColumns.join(', ')}]`;
            } else {
                description = `Column mismatch. Missing: [${missingColumns.join(', ')}], Extra: [${extraColumns.join(', ')}]`;
            }
            
            differences.push({
                type: 'COLUMN_MISMATCH',
                description,
                expected: expectedColumns,
                actual: studentColumns
            });
            return false;
        }
        
        return true; // All columns match (order independent)
    }/**
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
    }    /**
     * Compares the actual data content between student and expected results.
     * Performs cell-by-cell comparison with normalization to determine if data matches exactly.
     * 
     * @param {QueryResult} studentResult - Student's query result
     * @param {QueryResult} expectedResult - Expected reference result
     * @param {ComparisonDifference[]} differences - Array to collect identified differences
     * @returns {boolean} True if all data matches exactly, false otherwise
     * 
     * @private
     * @description Data comparison process:
     * - Normalizes both result sets for consistent comparison
     * - Compares each row and cell systematically
     * - Reports the first difference found per row
     * - Returns true only if all rows and cells match exactly
     * - Handles various data types with appropriate normalization
     */
    private compareData(
        studentResult: QueryResult,
        expectedResult: QueryResult,
        differences: ComparisonDifference[]
    ): boolean {        const normalizedStudent = this.normalizeResultSet(studentResult);
        const normalizedExpected = this.normalizeResultSet(expectedResult);
        
        const totalRows = normalizedExpected.rows.length;
        
        // Compare each row
        for (let i = 0; i < totalRows; i++) {
            const studentRow = normalizedStudent.rows[i];
            const expectedRow = normalizedExpected.rows[i];
            
            // Map student row to expected column order for fair comparison
            const mappedStudentRow = this.mapRowToExpectedColumns(
                studentRow, 
                normalizedExpected.columns
            );
            
            if (!this.rowsMatch(mappedStudentRow, expectedRow, normalizedExpected.columns)) {
                // Find first differing value for error message
                for (const column of normalizedExpected.columns) {
                    if (mappedStudentRow[column] !== expectedRow[column]) {
                        differences.push({
                            type: 'DATA_MISMATCH',
                            description: `Data mismatch in row ${i + 1}, column '${column}'`,
                            expected: expectedRow[column],
                            actual: mappedStudentRow[column],
                            position: { row: i + 1, column }
                        });
                        break; // Only report first difference per row
                    }
                }
                return false; // Data doesn't match exactly
            }
        }
        
        return true; // All data matches exactly
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
     * @private     * @description Normalization ensures:
     * - Case-insensitive column comparison
     * - Consistent value formatting (strings, numbers, dates, nulls)
     * - Deterministic row ordering through column-independent sorting
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
        });        // Sort rows for deterministic comparison (column-order independent)
        normalizedRows.sort((a, b) => {
            // Create sortable strings that are independent of column order
            const aSorted = this.createSortableString(a);
            const bSorted = this.createSortableString(b);
            return aSorted.localeCompare(bSorted);
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

    /**
     * Creates a sortable string representation of a row that is independent of column order.
     * Used for deterministic row sorting when column order may vary between student and expected results.
     * 
     * @param {Record<string, any>} row - The row object to create a sortable string for
     * @returns {string} A deterministic string representation for sorting
     * 
     * @private
     * @description This method ensures consistent row ordering by:
     * - Sorting object keys alphabetically
     * - Creating consistent key-value pair representations
     * - Using a delimiter to separate pairs for reliable comparison
     */
    private createSortableString(row: Record<string, any>): string {
        // Sort keys alphabetically, then create string representation
        const sortedKeys = Object.keys(row).sort();
        const sortedPairs = sortedKeys.map(key => `${key}:${JSON.stringify(row[key])}`);
        return sortedPairs.join('|');
    }

    /**
     * Maps a student row to match the expected column order for consistent comparison.
     * Ensures that rows can be compared even when columns are in different order.
     * 
     * @param {Record<string, any>} studentRow - The student's row data
     * @param {string[]} expectedColumns - The expected column order
     * @returns {Record<string, any>} Row with columns reordered to match expected structure
     * 
     * @private
     * @description This mapping allows fair comparison by:
     * - Reordering student data to match expected column sequence
     * - Preserving all data values while standardizing structure
     * - Enabling accurate cell-by-cell comparison
     */
    private mapRowToExpectedColumns(
        studentRow: Record<string, any>,
        expectedColumns: string[]
    ): Record<string, any> {
        const mappedRow: Record<string, any> = {};
        
        for (const column of expectedColumns) {
            mappedRow[column] = studentRow[column];
        }
        
        return mappedRow;
    }

    /**
     * Checks if an array of column names contains duplicates.
     * Used to validate that queries don't have duplicate column selections.
     * 
     * @param {string[]} columns - Array of column names to check
     * @returns {boolean} True if duplicates are found
     * 
     * @private
     * @description This method ensures data integrity by detecting:
     * - Exact duplicate column names
     * - Case-insensitive duplicates after normalization
     * - Helps prevent ambiguous result structures
     */
    private hasDuplicateColumns(columns: string[]): boolean {
        return columns.length !== new Set(columns).size;
    }
}
