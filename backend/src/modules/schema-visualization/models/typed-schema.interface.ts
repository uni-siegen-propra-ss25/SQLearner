/**
 * Typed interfaces for unified schema representation
 * Replaces the previous `any` types with strict typing
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

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

export interface ForeignKeySchema {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  constraintName?: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

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
 * Custom error classes for granular error handling
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
