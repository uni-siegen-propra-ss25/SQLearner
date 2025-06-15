// Common SQL data types with descriptions
export enum SqlDataType {
    INT = 'INT',
    VARCHAR = 'VARCHAR',
    TEXT = 'TEXT',
    DATE = 'DATE',
    TIMESTAMP = 'TIMESTAMP',
    BOOLEAN = 'BOOLEAN',
    DECIMAL = 'DECIMAL',
    FLOAT = 'FLOAT'
}

export interface ColumnMetadata {
    maxLength?: number;
    precision?: number;
    scale?: number;
}
