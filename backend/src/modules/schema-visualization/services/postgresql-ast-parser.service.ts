import { parse } from 'pgsql-ast-parser';
import { 
  TypedJsonSchema, 
  TableSchema, 
  ColumnSchema, 
  ForeignKeySchema,
  SchemaParsingError,
  ASTMappingError,
  UnsupportedDDLError
} from '../models/typed-schema.interface';

/**
 * PostgreSQL AST Parser for DDL statements
 * Converts PostgreSQL DDL to typed JSON schema
 */
export class PostgreSQLASTParser {
  /**
   * Parses a PostgreSQL DDL string and returns a typed JSON schema representation.
   * @param {string} ddl - The PostgreSQL DDL string to parse.
   * @returns {TypedJsonSchema} - The parsed schema as a typed JSON object.
   * @throws {SchemaParsingError} - If parsing fails due to syntax or unsupported features.
   */
  parseSchema(ddl: string): TypedJsonSchema {
    try {
      // Parse DDL to AST
      const ast = parse(ddl);
      
      // Extract tables and foreign keys from AST
      const tables: TableSchema[] = [];
      const foreignKeys: ForeignKeySchema[] = [];
      
      for (const statement of ast) {
        if (statement.type === 'create table') {
          const table = this.mapCreateTableStatement(statement);
          tables.push(table);
          
          // Extract foreign keys from table definition
          const tableForeignKeys = this.extractForeignKeysFromTable(statement);
          foreignKeys.push(...tableForeignKeys);
        }
        // Note: ALTER TABLE support removed due to type complexity
        // Focus on CREATE TABLE statements which contain most DDL information
      }
      
      return {
        tables,
        foreignKeys,
        metadata: {
          dialect: 'postgresql',
          parsedAt: new Date(),
          source: 'pgsql-ast-parser'
        }
      };
      
    } catch (error) {
      if (error.location) {
        throw new SchemaParsingError(
          `PostgreSQL parsing error: ${error.message}`,
          error.location.start?.line,
          error.location.start?.column,
          this.extractErrorFragment(ddl, error.location)
        );
      }
      throw new SchemaParsingError(`PostgreSQL parsing error: ${error.message}`);
    }
  }
  
  /**
   * Maps a CREATE TABLE AST node to a TableSchema object.
   * @param {any} statement - The AST node representing the CREATE TABLE statement.
   * @returns {TableSchema} - The mapped table schema.
   * @throws {ASTMappingError} - If mapping fails due to missing or invalid data.
   */
  private mapCreateTableStatement(statement: any): TableSchema {
    try {
      const tableName = statement.name?.name;
      if (!tableName) {
        throw new ASTMappingError('Table name not found in CREATE TABLE statement');
      }
      
      const columns: ColumnSchema[] = [];
      
      for (const column of statement.columns || []) {
        if (column.kind === 'column') {
          const columnSchema = this.mapColumnDefinition(column, tableName);
          columns.push(columnSchema);
        }
      }
      
      // Handle table-level constraints (PRIMARY KEY, UNIQUE, etc.)
      this.handleTableConstraints(statement, columns);
      
      return {
        name: tableName,
        columns
      };
      
    } catch (error) {
      if (error instanceof ASTMappingError) throw error;
      throw new ASTMappingError(`Failed to map CREATE TABLE statement: ${error.message}`);
    }
  }
  
  /**
   * Maps a column definition AST node to a ColumnSchema object.
   * @param {any} column - The AST node representing the column definition.
   * @param {string} tableName - The name of the table the column belongs to.
   * @returns {ColumnSchema} - The mapped column schema.
   * @throws {ASTMappingError} - If mapping fails due to missing or invalid data.
   */
  private mapColumnDefinition(column: any, tableName: string): ColumnSchema {
    try {
      const columnName = column.name?.name;
      if (!columnName) {
        throw new ASTMappingError('Column name not found', tableName);
      }
      
      const columnType = this.mapDataType(column.dataType);
      let isPrimaryKey = false;
      let isNullable = true;
      let isUnique = false;
      let isForeignKey = false;
      let defaultValue: string | null = null;
      const constraints: string[] = [];
      
      // Process column constraints
      for (const constraint of column.constraints || []) {
        switch (constraint.type) {
          case 'primary key':
            isPrimaryKey = true;
            isNullable = false;
            constraints.push('PRIMARY KEY');
            break;
          case 'not null':
            isNullable = false;
            constraints.push('NOT NULL');
            break;
          case 'unique':
            isUnique = true;
            constraints.push('UNIQUE');
            break;
          case 'default':
            defaultValue = this.extractDefaultValue(constraint);
            constraints.push(`DEFAULT ${defaultValue}`);
            break;
          case 'foreign key':
            isForeignKey = true;
            constraints.push('FOREIGN KEY');
            break;
        }
      }
      
      return {
        name: columnName,
        type: columnType,
        isPrimaryKey,
        isNullable,
        isUnique,
        isForeignKey,
        defaultValue,
        constraints
      };
      
    } catch (error) {
      throw new ASTMappingError(`Failed to map column definition: ${error.message}`, tableName, column.name?.name);
    }
  }
  
  /**
   * Maps a PostgreSQL data type AST node to a normalized string representation.
   * @param {any} dataType - The AST node representing the data type.
   * @returns {string} - The normalized data type as a string.
   */
  private mapDataType(dataType: any): string {
    if (!dataType) return 'UNKNOWN';
    
    const typeName = dataType.name?.toUpperCase();
    
    switch (typeName) {
      case 'INTEGER':
      case 'INT':
      case 'INT4':
        return 'INTEGER';
      case 'BIGINT':
      case 'INT8':
        return 'BIGINT';
      case 'SMALLINT':
      case 'INT2':
        return 'SMALLINT';
      case 'SERIAL':
        return 'SERIAL';
      case 'BIGSERIAL':
        return 'BIGSERIAL';
      case 'VARCHAR':
      case 'CHARACTER VARYING':
        return dataType.length ? `VARCHAR(${dataType.length})` : 'VARCHAR';
      case 'CHAR':
      case 'CHARACTER':
        return dataType.length ? `CHAR(${dataType.length})` : 'CHAR';
      case 'TEXT':
        return 'TEXT';
      case 'BOOLEAN':
      case 'BOOL':
        return 'BOOLEAN';
      case 'TIMESTAMP':
        return 'TIMESTAMP';
      case 'DATE':
        return 'DATE';
      case 'TIME':
        return 'TIME';
      case 'DECIMAL':
      case 'NUMERIC':
        if (dataType.precision && dataType.scale) {
          return `NUMERIC(${dataType.precision}, ${dataType.scale})`;
        } else if (dataType.precision) {
          return `NUMERIC(${dataType.precision})`;
        }
        return 'NUMERIC';
      case 'REAL':
        return 'REAL';
      case 'DOUBLE PRECISION':
      case 'FLOAT8':
        return 'DOUBLE PRECISION';
      case 'UUID':
        return 'UUID';
      case 'JSON':
        return 'JSON';
      case 'JSONB':
        return 'JSONB';
      default:
        // Handle array types, custom types, etc.
        if (dataType.arrayOf) {
          const baseType = this.mapDataType(dataType.arrayOf);
          return `${baseType}[]`;
        }
        return typeName || 'UNKNOWN';
    }
  }
  
  /**
   * Applies table-level constraints (e.g., PRIMARY KEY, UNIQUE) to the column schemas.
   * @param {any} statement - The AST node representing the CREATE TABLE statement.
   * @param {ColumnSchema[]} columns - The array of column schemas to update.
   */
  private handleTableConstraints(statement: any, columns: ColumnSchema[]): void {
    for (const constraint of statement.constraints || []) {
      switch (constraint.type) {
        case 'primary key':
          // Mark columns as primary key
          for (const col of constraint.columns || []) {
            const column = columns.find(c => c.name === col.name);
            if (column) {
              column.isPrimaryKey = true;
              column.isNullable = false;
              if (!column.constraints?.includes('PRIMARY KEY')) {
                column.constraints = column.constraints || [];
                column.constraints.push('PRIMARY KEY');
              }
            }
          }
          break;
        case 'unique':
          // Mark columns as unique
          for (const col of constraint.columns || []) {
            const column = columns.find(c => c.name === col.name);
            if (column) {
              column.isUnique = true;
              if (!column.constraints?.includes('UNIQUE')) {
                column.constraints = column.constraints || [];
                column.constraints.push('UNIQUE');
              }
            }
          }
          break;
      }
    }
  }
  
  /**
   * Extracts all foreign key constraints from a CREATE TABLE AST node.
   * @param {any} statement - The AST node representing the CREATE TABLE statement.
   * @returns {ForeignKeySchema[]} - Array of extracted foreign key schemas.
   */
  private extractForeignKeysFromTable(statement: any): ForeignKeySchema[] {
    const foreignKeys: ForeignKeySchema[] = [];
    const tableName = statement.name?.name;
    
    // Column-level foreign keys
    for (const column of statement.columns || []) {
      for (const constraint of column.constraints || []) {
        if (constraint.type === 'foreign key') {
          const fk = this.mapForeignKeyConstraint(constraint, tableName, column.name?.name);
          if (fk) foreignKeys.push(fk);
        }
      }
    }
    
    // Table-level foreign keys
    for (const constraint of statement.constraints || []) {
      if (constraint.type === 'foreign key') {
        const sourceColumn = constraint.columns?.[0]?.name;
        const fk = this.mapForeignKeyConstraint(constraint, tableName, sourceColumn);
        if (fk) foreignKeys.push(fk);
      }
    }
    
    return foreignKeys;
  }
  
  /**
   * Maps a foreign key constraint AST node to a ForeignKeySchema object.
   * @param {any} constraint - The AST node representing the foreign key constraint.
   * @param {string} sourceTable - The name of the source table.
   * @param {string} sourceColumn - The name of the source column.
   * @returns {ForeignKeySchema|null} - The mapped foreign key schema or null if mapping fails.
   */
  private mapForeignKeyConstraint(constraint: any, sourceTable: string, sourceColumn: string): ForeignKeySchema | null {
    try {
      const targetTable = constraint.references?.table?.name;
      const targetColumn = constraint.references?.columns?.[0]?.name;
      
      if (!targetTable || !targetColumn) {
        return null;
      }
      
      return {
        sourceTable,
        sourceColumn,
        targetTable,
        targetColumn,
        constraintName: constraint.name?.name,
        onDelete: constraint.onDelete,
        onUpdate: constraint.onUpdate
      };
      
    } catch (error) {
      console.warn(`Failed to map foreign key constraint: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Extracts the default value from a column constraint AST node.
   * @param {any} constraint - The AST node representing the default constraint.
   * @returns {string|null} - The extracted default value or null if not present.
   */
  private extractDefaultValue(constraint: any): string | null {
    try {
      if (constraint.default?.type === 'string') {
        return constraint.default.value;
      } else if (constraint.default?.type === 'numeric') {
        return constraint.default.value.toString();
      } else if (constraint.default?.type === 'boolean') {
        return constraint.default.value.toString();
      } else if (constraint.default?.type === 'null') {
        return 'NULL';
      } else if (constraint.default?.name) {
        // Function calls like NOW(), CURRENT_TIMESTAMP, etc.
        return constraint.default.name;
      }
      return constraint.default?.toString() || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extracts a code fragment from the DDL string for error reporting.
   * @param {string} ddl - The original DDL string.
   * @param {any} location - The error location object from the parser.
   * @returns {string} - The extracted code fragment for context.
   */
  private extractErrorFragment(ddl: string, location: any): string {
    try {
      const lines = ddl.split('\n');
      const lineIndex = (location.start?.line || 1) - 1;
      const line = lines[lineIndex];
      const column = location.start?.column || 0;
      
      return line ? `Line ${lineIndex + 1}: ${line.substring(Math.max(0, column - 20), column + 20)}` : '';
    } catch {
      return '';
    }
  }
}
