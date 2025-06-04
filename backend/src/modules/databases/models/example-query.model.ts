export interface ExampleQuery {
    name: string;
    query: string;
    description?: string;
}

export interface ExampleQueryResult {
    name: string;
    query: string;
    description?: string;
    result?: {
        columns: string[];
        rows: any[];
        rowCount?: number;
        command?: string;
    };
    error?: string;
} 