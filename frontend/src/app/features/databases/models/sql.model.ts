// Common SQL data types with descriptions
export enum SqlDataType {
    INT = 'INT',
    // BIGINT = 'BIGINT',
    // SMALLINT = 'SMALLINT',
    VARCHAR = 'VARCHAR',
    TEXT = 'TEXT',
    DATE = 'DATE',
    TIMESTAMP = 'TIMESTAMP',
    BOOLEAN = 'BOOLEAN',
    DECIMAL = 'DECIMAL',
    FLOAT = 'FLOAT',
    // DOUBLE = 'DOUBLE',
}

export interface ColumnMetadata {
    maxLength?: number;
    precision?: number;
    scale?: number;
}
