export interface QueryResult {
    columns: string[];
    rows: Record<string, any>[];
    rowCount: number;
    executionTimeMs: number;
}
