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
      
      // Mark columns as foreign keys based on extracted foreign key constraints
      this.markForeignKeyColumns(tables, foreignKeys);
      
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
          case 'reference':
            isForeignKey = true;
            constraints.push('FOREIGN KEY');
            break;
        }
      }

      // Check for inline REFERENCES syntax (e.g., user_id INTEGER REFERENCES users(id))
      if (column.references) {
        isForeignKey = true;
        constraints.push('FOREIGN KEY');
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
    
    // Column-level foreign keys (inline REFERENCES syntax)
    for (const column of statement.columns || []) {
      
      // Check column constraints for FK
      for (const constraint of column.constraints || []) {
        if (constraint.type === 'foreign key') {
          const fk = this.mapForeignKeyConstraint(constraint, tableName, column.name?.name);
          if (fk) foreignKeys.push(fk);
        }
        // Handle inline REFERENCES syntax (e.g., user_id INTEGER REFERENCES users(id))
        if (constraint.type === 'reference') {
          const targetTable = this.getTableNameOnly(constraint.foreignTable);
          const targetColumn = constraint.foreignColumns?.[0]?.name;
          
          if (targetTable && targetColumn) {
            const fk: ForeignKeySchema = {
              sourceTable: tableName,
              sourceColumn: column.name?.name,
              targetTable,
              targetColumn,
              constraintName: undefined, // Inline FKs usually don't have names
              onDelete: constraint.onDelete?.toUpperCase(),
              onUpdate: constraint.onUpdate?.toUpperCase()
            };
            foreignKeys.push(fk);
          }
        }
      }

      // Check for inline REFERENCES syntax (e.g., user_id INTEGER REFERENCES users(id))
      if (column.references) {
        const targetTable = this.getQualifiedTableName(column.references.table);
        const targetColumn = column.references.columns?.[0]?.name;
        
        if (targetTable && targetColumn) {
          const fk: ForeignKeySchema = {
            sourceTable: tableName,
            sourceColumn: column.name?.name,
            targetTable,
            targetColumn,
            constraintName: undefined, // Inline FKs usually don't have names
            onDelete: column.references.onDelete,
            onUpdate: column.references.onUpdate
          };
          foreignKeys.push(fk);
        }
      }
    }

    // Table-level foreign keys (FOREIGN KEY statements)
    for (const constraint of statement.constraints || []) {
      if (constraint.type === 'foreign key') {
        // Support for multi-column foreign keys
        const sourceColumns = constraint.localColumns?.map(col => col.name).filter(name => name);
        const targetTable = this.getTableNameOnly(constraint.foreignTable);
        const targetColumns = constraint.foreignColumns?.map(col => col.name).filter(name => name);
        
        if (sourceColumns?.length && targetTable && targetColumns?.length) {
          // Validate column count match
          if (sourceColumns.length !== targetColumns.length) {
            console.warn(`⚠️  Warning: Foreign key column count mismatch: ${sourceColumns.length} source columns vs ${targetColumns.length} target columns`);
            continue; // Skip this FK
          }
          
          const fk: ForeignKeySchema = {
            sourceTable: tableName,
            sourceColumn: sourceColumns.length === 1 ? sourceColumns[0] : sourceColumns,
            targetTable,
            targetColumn: targetColumns.length === 1 ? targetColumns[0] : targetColumns,
            constraintName: constraint.name?.name,
            onDelete: constraint.onDelete?.toUpperCase(),
            onUpdate: constraint.onUpdate?.toUpperCase()
          };
          
          foreignKeys.push(fk);
        }
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
      // Remove schema qualification - use only table name
      const targetTable = this.getTableNameOnly(constraint.foreignTable || constraint.references?.table);
      const targetColumn = constraint.foreignColumns?.[0]?.name || constraint.references?.columns?.[0]?.name;
      
      if (!targetTable || !targetColumn) {
        return null;
      }

      const fkSchema = {
        sourceTable,
        sourceColumn,
        targetTable,
        targetColumn,
        constraintName: constraint.name?.name,
        onDelete: constraint.onDelete?.toUpperCase(),
        onUpdate: constraint.onUpdate?.toUpperCase()
      };
      
      return fkSchema;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Extracts qualified table name from AST node, supporting schema.table format.
   * @param {any} tableNode - The AST node representing a table reference.
   * @returns {string} - The qualified table name (schema.table or just table).
   */
  private getQualifiedTableName(tableNode: any): string {
    if (!tableNode) return '';
    
    // Handle schema-qualified table names
    if (tableNode.schema && tableNode.name) {
      return `${tableNode.schema}.${tableNode.name}`;
    }
    
    // Handle simple table names
    if (tableNode.name) {
      return tableNode.name;
    }
    
    // Fallback for older parser versions
    if (typeof tableNode === 'string') {
      return tableNode;
    }
    
    return '';
  }
  
  /**
   * Extracts only the table name from AST node, ignoring schema qualification.
   * @param {any} tableNode - The AST node representing a table reference.
   * @returns {string} - The table name without schema prefix.
   */
  private getTableNameOnly(tableNode: any): string {
    if (!tableNode) return '';
    
    // Handle simple table names
    if (tableNode.name) {
      return tableNode.name;
    }
    
    // Fallback for older parser versions
    if (typeof tableNode === 'string') {
      return tableNode;
    }
    
    return '';
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

  /**
   * Marks columns as foreign keys based on the extracted foreign key constraints.
   * This is necessary because foreign keys can be defined at table level, not just column level.
   * @param {TableSchema[]} tables - The array of tables to update.
   * @param {ForeignKeySchema[]} foreignKeys - The array of foreign key constraints.
   */
  private markForeignKeyColumns(tables: TableSchema[], foreignKeys: ForeignKeySchema[]): void {
    // First, validate all foreign keys
    for (const fk of foreignKeys) {
      // Normalize source and target columns to arrays
      const sourceColumns = Array.isArray(fk.sourceColumn) ? fk.sourceColumn : [fk.sourceColumn];
      const targetColumns = Array.isArray(fk.targetColumn) ? fk.targetColumn : [fk.targetColumn];

      // Validate source table exists
      const sourceTable = tables.find(t => t.name === fk.sourceTable);
      if (!sourceTable) {
        throw new SchemaParsingError(
          `Foreign key validation error: Source table '${fk.sourceTable}' not found`,
          undefined,
          undefined,
          `FK: ${fk.sourceTable}.[${sourceColumns.join(', ')}] -> ${fk.targetTable}.[${targetColumns.join(', ')}]`
        );
      }

      // Validate all source columns exist
      for (const sourceColumnName of sourceColumns) {
        const sourceColumn = sourceTable.columns.find(c => c.name === sourceColumnName);
        if (!sourceColumn) {
          throw new SchemaParsingError(
            `Foreign key validation error: Source column '${sourceColumnName}' not found in table '${fk.sourceTable}'`,
            undefined,
            undefined,
            `FK: ${fk.sourceTable}.[${sourceColumns.join(', ')}] -> ${fk.targetTable}.[${targetColumns.join(', ')}]`
          );
        }
      }

      // Validate target table exists (warn if not found, as it may be external)
      const targetTable = tables.find(t => t.name === fk.targetTable);
      if (!targetTable) {
        console.warn(`⚠️  Warning: Target table '${fk.targetTable}' not found. FK will be processed but may be invalid.`);
      } else {
        // Validate all target columns exist if target table is found
        for (const targetColumnName of targetColumns) {
          const targetColumn = targetTable.columns.find(c => c.name === targetColumnName);
          if (!targetColumn) {
            console.warn(`⚠️  Warning: Target column '${targetColumnName}' not found in table '${fk.targetTable}'. FK will be processed but may be invalid.`);
          }
        }
      }
    }
    
    // Mark columns as foreign keys if validation passed
    for (const fk of foreignKeys) {
      const sourceColumns = Array.isArray(fk.sourceColumn) ? fk.sourceColumn : [fk.sourceColumn];
      
      const table = tables.find(t => t.name === fk.sourceTable);
      
      if (table) {
        // Mark all source columns as foreign keys
        for (const sourceColumnName of sourceColumns) {
          const column = table.columns.find(c => c.name === sourceColumnName);
          if (column) {
            column.isForeignKey = true;
            // Add FOREIGN KEY to constraints if not already present
            if (!column.constraints?.includes('FOREIGN KEY')) {
              column.constraints = column.constraints || [];
              column.constraints.push('FOREIGN KEY');
            }
          }
        }
      }
    }
  }
}
