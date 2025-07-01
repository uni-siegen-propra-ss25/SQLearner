import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ERDiagramDto, TableNodeDto, RelationshipDto, ColumnDto, ParseSchemaDto } from '../models/er-diagram.dto';
import { DatabasesService } from '../../databases/services/databases.service';
import { PostgreSQLASTParser } from './postgresql-ast-parser.service';
import { 
  TypedJsonSchema, 
  TableSchema, 
  ColumnSchema, 
  ForeignKeySchema,
  SchemaParsingError,
  ASTMappingError,
  UnsupportedDDLError
} from '../models/typed-schema.interface';

@Injectable()
export class SchemaVisualizationService {
    private readonly postgresParser = new PostgreSQLASTParser();
    
    constructor(private readonly databasesService: DatabasesService) {}

    async parseSchemaString(parseSchemaDto: ParseSchemaDto): Promise<ERDiagramDto> {
        let typedSchema: TypedJsonSchema;
        
        try {
            // 1. Parse SQL Schema with PostgreSQL AST parser
            try {
                typedSchema = this.postgresParser.parseSchema(parseSchemaDto.schema);
            } catch (error) {
                // Handle parsing errors with specific error messages
                if (error instanceof SchemaParsingError) {
                    throw new BadRequestException(
                        `Schema parsing failed: ${error.message}` +
                        (error.line ? ` at line ${error.line}` : '') +
                        (error.sqlFragment ? ` (${error.sqlFragment})` : '')
                    );
                } else if (error instanceof UnsupportedDDLError) {
                    throw new BadRequestException(
                        `Unsupported DDL feature: ${error.feature}. ${error.suggestion || ''}`
                    );
                }
                
                // Fallback to custom parser for legacy compatibility
                console.warn('PostgreSQL AST parser failed, using custom parser fallback:', error.message);
                typedSchema = await this.parseSchemaWithCustomParser(parseSchemaDto.schema);
            }
            
            // 2. Convert Typed Schema to DBML
            const dbmlCode = this.convertTypedSchemaToDbml(typedSchema, parseSchemaDto.name || 'Schema');
            
            // 3. Convert to internal DTO format
            const { tables, relationships } = this.mapTypedSchemaToDto(typedSchema);
            
            // 4. Calculate positions for visualization
            const positioned = this.calculatePositions({ tables, relationships });
            
            return {
                tables: positioned.tables,
                relationships: positioned.relationships,
                metadata: {
                    databaseName: parseSchemaDto.name || 'Exercise Schema',
                    tableCount: positioned.tables.length,
                    relationshipCount: positioned.relationships.length
                },
                dbmlCode,
                jsonSchema: typedSchema // Return typed schema instead of any
            };
            
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            
            if (error instanceof ASTMappingError) {
                throw new InternalServerErrorException(
                    `Schema mapping failed: ${error.message}` +
                    (error.tableName ? ` (table: ${error.tableName})` : '') +
                    (error.columnName ? ` (column: ${error.columnName})` : '')
                );
            }
            
            console.error('Unexpected schema parsing error:', error);
            throw new InternalServerErrorException(`Failed to parse schema: ${error.message}`);
        }
    }

    async visualizeDatabase(databaseId: number): Promise<ERDiagramDto> {
        try {
            const { schema } = await this.databasesService.getDatabaseSchema(databaseId);
            const database = await this.databasesService.getDatabaseById(databaseId);
            
            return this.parseSchemaString({ 
                schema, 
                name: database.name || `Database ${databaseId}` 
            });
        } catch (error) {
            console.error('Database visualization error:', error);
            throw new Error(`Failed to visualize database: ${error.message}`);
        }
    }

    /**
     * Fallback parser using regex-based approach
     * Returns TypedJsonSchema for consistency with AST parser
     */
    private async parseSchemaWithCustomParser(schemaSql: string): Promise<TypedJsonSchema> {
        // Enhanced parsing logic based on original regex approach but improved
        const tablesMap: { [name: string]: { columns: { [name: string]: any } } } = {};
        const foreignKeys: ForeignKeySchema[] = [];
        
        const lines = schemaSql.split('\n');
        let currentTable: string | null = null;

        const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?\s*\(/i;
        const columnRegex = /^\s*["`]?(\w+)["`]?\s+([\w()]+)(?:\s+(.*))?$/i;
        const foreignKeyRegex = /REFERENCES\s+["`]?(\w+)["`]?\s*\(\s*["`]?(\w+)["`]?\s*\)/i;
        const primaryKeyRegex = /PRIMARY\s+KEY/i;
        const uniqueRegex = /UNIQUE/i;
        const notNullRegex = /NOT\s+NULL/i;

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) continue;
            
            const createTableMatch = trimmed.match(createTableRegex);
            if (createTableMatch) {
                currentTable = createTableMatch[1];
                tablesMap[currentTable] = { columns: {} };
                continue;
            }

            if (currentTable && !trimmed.includes(');') && trimmed.length > 0) {
                // Skip table-level PRIMARY KEY constraints
                if (trimmed.startsWith('PRIMARY KEY') && trimmed.includes('(')) {
                    continue;
                }
                
                const columnMatch = trimmed.match(columnRegex);
                if (columnMatch) {
                    const columnName = columnMatch[1];
                    const columnType = columnMatch[2];
                    const constraints = columnMatch[3] || '';

                    const foreignKeyMatch = constraints.match(foreignKeyRegex);
                    if (foreignKeyMatch) {
                        foreignKeys.push({
                            sourceTable: currentTable,
                            sourceColumn: columnName,
                            targetTable: foreignKeyMatch[1],
                            targetColumn: foreignKeyMatch[2]
                        });
                    }

                    tablesMap[currentTable].columns[columnName] = {
                        type: columnType,
                        primaryKey: primaryKeyRegex.test(constraints),
                        foreignKey: foreignKeyRegex.test(constraints),
                        unique: uniqueRegex.test(constraints),
                        notNull: notNullRegex.test(constraints),
                        default: this.extractDefault(constraints)
                    };
                }
            }

            if (trimmed.includes(');')) {
                currentTable = null;
            }
        }

        // Convert to TypedJsonSchema format
        const tables: TableSchema[] = Object.entries(tablesMap).map(([tableName, tableData]) => ({
            name: tableName,
            columns: Object.entries(tableData.columns).map(([columnName, columnData]) => ({
                name: columnName,
                type: this.normalizeColumnType(columnData.type || 'varchar'),
                isPrimaryKey: columnData.primaryKey || false,
                isForeignKey: columnData.foreignKey || false,
                isUnique: columnData.unique || false,
                isNullable: !columnData.notNull,
                defaultValue: columnData.default,
                constraints: this.buildConstraintsArray(columnData)
            }))
        }));

        return {
            tables,
            foreignKeys,
            metadata: {
                dialect: 'postgresql',
                parsedAt: new Date(),
                source: 'fallback'
            }
        };
    }

    /**
     * Convert TypedJsonSchema to DBML format
     */
    private convertTypedSchemaToDbml(typedSchema: TypedJsonSchema, databaseName: string): string {
        try {
            let dbml = `Project ${databaseName} {\n`;
            dbml += `  database_type: 'PostgreSQL'\n`;
            dbml += `  Note: 'Generated from SQL Schema via ${typedSchema.metadata?.source || 'unknown parser'}'\n`;
            dbml += `}\n\n`;

            // Add tables
            for (const table of typedSchema.tables) {
                dbml += `Table ${table.name} {\n`;
                
                for (const column of table.columns) {
                    const type = this.mapSqlTypeToDbml(column.type);
                    let columnLine = `  ${column.name} ${type}`;
                    
                    const attributes: string[] = [];
                    if (column.isPrimaryKey) attributes.push('pk');
                    if (!column.isNullable) attributes.push('not null');
                    if (column.isUnique) attributes.push('unique');
                    if (column.defaultValue) attributes.push(`default: '${column.defaultValue}'`);
                    
                    if (attributes.length > 0) {
                        columnLine += ` [${attributes.join(', ')}]`;
                    }
                    
                    dbml += columnLine + '\n';
                }
                
                dbml += `}\n\n`;
            }

            // Add relationships (foreign keys)
            for (const fk of typedSchema.foreignKeys) {
                dbml += `Ref: ${fk.sourceTable}.${fk.sourceColumn} > ${fk.targetTable}.${fk.targetColumn}`;
                if (fk.onDelete) dbml += ` [delete: ${fk.onDelete.toLowerCase()}]`;
                dbml += '\n';
            }
            
            if (typedSchema.foreignKeys.length > 0) {
                dbml += '\n';
            }

            return dbml;
        } catch (error) {
            console.error('DBML conversion error:', error);
            return `// Error generating DBML: ${error.message}`;
        }
    }

    /**
     * Convert TypedJsonSchema to internal DTO format
     */
    private mapTypedSchemaToDto(typedSchema: TypedJsonSchema): { tables: TableNodeDto[], relationships: RelationshipDto[] } {
        const tables: TableNodeDto[] = [];
        const relationships: RelationshipDto[] = [];

        // Map tables
        for (const table of typedSchema.tables) {
            const columns: ColumnDto[] = table.columns.map(column => ({
                name: column.name,
                type: column.type,
                isPrimaryKey: column.isPrimaryKey,
                isForeignKey: column.isForeignKey,
                isUnique: column.isUnique,
                isNullable: column.isNullable,
                constraints: column.constraints?.join(' ') || ''
            }));

            tables.push({
                id: table.name,
                name: table.name,
                columns,
                x: 0,
                y: 0,
                width: 200,
                height: Math.max(120, 30 + (columns.length * 25))
            });
        }

        // Map relationships from foreign keys
        for (const fk of typedSchema.foreignKeys) {
            relationships.push({
                id: `${fk.sourceTable}.${fk.sourceColumn}_to_${fk.targetTable}.${fk.targetColumn}`,
                fromTable: fk.sourceTable,
                fromColumn: fk.sourceColumn,
                toTable: fk.targetTable,
                toColumn: fk.targetColumn,
                type: 'many-to-one',
                label: fk.constraintName || '',
            });
        }

        return { tables, relationships };
    }

    private calculatePositions(data: { tables: TableNodeDto[], relationships: RelationshipDto[] }): { tables: TableNodeDto[], relationships: RelationshipDto[] } {
        const tables = [...data.tables];
        const relationships = [...data.relationships];

        // Enhanced grid layout with better spacing
        const gridWidth = 350;
        const gridHeight = 280;
        const startX = 50;
        const startY = 50;
        const maxColumns = Math.ceil(Math.sqrt(tables.length));

        tables.forEach((table, index) => {
            const row = Math.floor(index / maxColumns);
            const col = index % maxColumns;
            
            table.x = startX + (col * gridWidth);
            table.y = startY + (row * gridHeight);
            table.height = Math.max(120, 50 + (table.columns.length * 30));
        });

        return { tables, relationships };
    }

    private extractDefault(constraints: string): string | null {
        const defaultMatch = constraints.match(/DEFAULT\s+([^,\s]+)/i);
        return defaultMatch ? defaultMatch[1].replace(/['"]/g, '') : null;
    }

    private mapSqlTypeToDbml(sqlType: string): string {
        const typeMap: { [key: string]: string } = {
            'INTEGER': 'int',
            'SERIAL': 'int',
            'BIGINT': 'bigint',
            'VARCHAR': 'varchar',
            'TEXT': 'text',
            'BOOLEAN': 'boolean',
            'TIMESTAMP': 'timestamp',
            'DATE': 'date',
            'DECIMAL': 'decimal',
            'FLOAT': 'float',
            'REAL': 'real'
        };

        const upperType = sqlType.toUpperCase().split('(')[0];
        return typeMap[upperType] || sqlType.toLowerCase();
    }

    private normalizeColumnType(type: string): string {
        const typeMap: { [key: string]: string } = {
            'INTEGER': 'INT',
            'SERIAL': 'INT',
            'BIGINT': 'BIGINT',
            'VARCHAR': 'VARCHAR',
            'TEXT': 'TEXT',
            'BOOLEAN': 'BOOL',
            'TIMESTAMP': 'TIMESTAMP',
            'DATE': 'DATE',
            'DECIMAL': 'DECIMAL',
            'FLOAT': 'FLOAT',
            'REAL': 'FLOAT'
        };

        const upperType = type.toUpperCase().split('(')[0];
        return typeMap[upperType] || type;
    }

    private buildConstraintsString(columnData: any): string {
        const constraints: string[] = [];
        
        if (columnData.primaryKey) constraints.push('PRIMARY KEY');
        if (columnData.foreignKey) constraints.push('FOREIGN KEY');
        if (columnData.unique) constraints.push('UNIQUE');
        if (columnData.notNull) constraints.push('NOT NULL');
        if (columnData.default) constraints.push(`DEFAULT ${columnData.default}`);
        
        return constraints.join(' ');
    }

    private buildConstraintsArray(columnData: any): string[] {
        const constraints: string[] = [];
        
        if (columnData.primaryKey) constraints.push('PRIMARY KEY');
        if (columnData.foreignKey) constraints.push('FOREIGN KEY');
        if (columnData.unique) constraints.push('UNIQUE');
        if (columnData.notNull) constraints.push('NOT NULL');
        if (columnData.default) constraints.push(`DEFAULT ${columnData.default}`);
        
        return constraints;
    }
}