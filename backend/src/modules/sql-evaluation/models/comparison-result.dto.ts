export interface ComparisonResult {
    isExactMatch: boolean;
    columnsMatch: boolean;
    rowCountMatch: boolean;
    dataAccuracy: number; // 0.0 - 1.0
    differences: ComparisonDifference[];
}

export interface ComparisonDifference {
    type: 'COLUMN_MISMATCH' | 'ROW_COUNT_MISMATCH' | 'DATA_MISMATCH';
    description: string;
    expected?: any;
    actual?: any;
    position?: { row?: number; column?: string };
}
