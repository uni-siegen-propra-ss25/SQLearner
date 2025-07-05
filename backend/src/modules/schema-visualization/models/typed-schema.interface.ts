/**
 * Typed interfaces for unified schema representation
 * Replaces the previous `any` types with strict typing
 */

/**
 * Interface representing a column in a database table for unified schema representation.
 * @property {string} name - The name of the column.
 * @property {string} type - The SQL data type of the column.
 * @property {boolean} isPrimaryKey - Whether the column is a primary key.
 * @property {boolean} isNullable - Whether the column allows null values.
 * @property {boolean} isUnique - Whether the column has a unique constraint.
 * @property {boolean} isForeignKey - Whether the column is a foreign key.
 * @property {string | null} [defaultValue] - The default value for the column, if any.
 * @property {string[]} [constraints] - Array of constraint strings for the column.
 */
export interface ColumnSchema {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isForeignKey: boolean;
  defaultValue?: string | null;
  constraints?: string[];
}

/**
 * Interface representing a table in the unified schema.
 * @property {string} name - The name of the table.
 * @property {ColumnSchema[]} columns - Array of columns in the table.
 */
export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

/**
 * Interface representing a foreign key relationship between tables.
 * @property {string} sourceTable - The name of the source table.
 * @property {string | string[]} sourceColumn - The name(s) of the source column(s). Single column as string, multi-column as array.
 * @property {string} targetTable - The name of the target table.
 * @property {string | string[]} targetColumn - The name(s) of the target column(s). Single column as string, multi-column as array.
 * @property {string} [constraintName] - Optional name of the foreign key constraint.
 * @property {'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'} [onDelete] - Optional ON DELETE action.
 * @property {'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'} [onUpdate] - Optional ON UPDATE action.
 */
export interface ForeignKeySchema {
  sourceTable: string;
  sourceColumn: string | string[];
  targetTable: string;
  targetColumn: string | string[];
  constraintName?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

/**
 * Interface representing the full typed JSON schema for a database.
 * @property {TableSchema[]} tables - Array of tables in the schema.
 * @property {ForeignKeySchema[]} foreignKeys - Array of foreign key relationships.
 * @property {object} [metadata] - Optional metadata about the schema (dialect, parse date, source).
 */
export interface TypedJsonSchema {
  tables: TableSchema[];
  foreignKeys: ForeignKeySchema[];
  metadata?: {
    dialect: 'postgresql' | 'mysql' | 'sqlite';
    parsedAt: Date;
    source: 'pgsql-ast-parser' | 'fallback';
  };
}

/**
 * Error thrown when schema parsing fails due to syntax or unsupported features.
 * @extends Error
 * @property {number} [line] - The line number where the error occurred.
 * @property {number} [column] - The column number where the error occurred.
 * @property {string} [sqlFragment] - The SQL fragment near the error.
 */
export class SchemaParsingError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
    public readonly column?: number,
    public readonly sqlFragment?: string
  ) {
    super(message);
    this.name = 'SchemaParsingError';
  }
}

/**
 * Error thrown when mapping the AST to a typed schema fails.
 * @extends Error
 * @property {string} [tableName] - The name of the table where the error occurred.
 * @property {string} [columnName] - The name of the column where the error occurred.
 * @property {any} [astNode] - The AST node related to the error.
 */
export class ASTMappingError extends Error {
  constructor(
    message: string,
    public readonly tableName?: string,
    public readonly columnName?: string,
    public readonly astNode?: any
  ) {
    super(message);
    this.name = 'ASTMappingError';
  }
}

/**
 * Error thrown when an unsupported DDL feature is encountered during parsing.
 * @extends Error
 * @property {string} feature - The name of the unsupported feature.
 * @property {string} [suggestion] - Optional suggestion for resolving the issue.
 */
export class UnsupportedDDLError extends Error {
  constructor(
    message: string,
    public readonly feature: string,
    public readonly suggestion?: string
  ) {
    super(message);
    this.name = 'UnsupportedDDLError';
  }
}
