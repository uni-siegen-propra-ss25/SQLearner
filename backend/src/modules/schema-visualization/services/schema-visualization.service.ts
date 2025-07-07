import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import {
    ERDiagramDto,
    TableNodeDto,
    RelationshipDto,
    ColumnDto,
    ParseSchemaDto,
} from '../models/er-diagram.dto';
import { DatabasesService } from '../../databases/services/databases.service';
import { PostgreSQLASTParser } from './postgresql-ast-parser.service';
import {
    TypedJsonSchema,
    TableSchema,
    ColumnSchema,
    ForeignKeySchema,
    SchemaParsingError,
    ASTMappingError,
    UnsupportedDDLError,
} from '../models/typed-schema.interface';

@Injectable()
export class SchemaVisualizationService {
    private readonly postgresParser = new PostgreSQLASTParser();

    constructor(private readonly databasesService: DatabasesService) {}

    /**
     * Parses a schema string and returns an ER diagram DTO for visualization.
     * @param {ParseSchemaDto} parseSchemaDto - DTO containing the schema string and optional name.
     * @returns {Promise<ERDiagramDto>} - The ER diagram data transfer object.
     * @throws {BadRequestException|InternalServerErrorException} - If parsing or mapping fails.
     */
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
                            (error.sqlFragment ? ` (${error.sqlFragment})` : ''),
                    );
                } else if (error instanceof UnsupportedDDLError) {
                    throw new BadRequestException(
                        `Unsupported DDL feature: ${error.feature}. ${error.suggestion || ''}`,
                    );
                }

                // Fallback to custom parser for legacy compatibility
                console.warn(
                    'PostgreSQL AST parser failed, using custom parser fallback:',
                    error.message,
                );
                typedSchema = await this.parseSchemaWithCustomParser(parseSchemaDto.schema);
            }

            // 2. Convert Typed Schema to DBML
            const dbmlCode = this.convertTypedSchemaToDbml(
                typedSchema,
                parseSchemaDto.name || 'Schema',
            );

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
                    relationshipCount: positioned.relationships.length,
                },
                dbmlCode,
                jsonSchema: typedSchema, // Return typed schema instead of any
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            if (error instanceof ASTMappingError) {
                throw new InternalServerErrorException(
                    `Schema mapping failed: ${error.message}` +
                        (error.tableName ? ` (table: ${error.tableName})` : '') +
                        (error.columnName ? ` (column: ${error.columnName})` : ''),
                );
            }

            console.error('Unexpected schema parsing error:', error);
            throw new InternalServerErrorException(`Failed to parse schema: ${error.message}`);
        }
    }

    /**
     * Visualizes a database schema by its database ID.
     * @param {number} databaseId - The ID of the database to visualize.
     * @returns {Promise<ERDiagramDto>} - The ER diagram data transfer object.
     * @throws {Error} - If the database schema cannot be visualized.
     */
    async visualizeDatabase(databaseId: number): Promise<ERDiagramDto> {
        try {
            const { schema } = await this.databasesService.getDatabaseSchema(databaseId);
            const database = await this.databasesService.getDatabaseById(databaseId);

            return this.parseSchemaString({
                schema,
                name: database.name || `Database ${databaseId}`,
            });
        } catch (error) {
            console.error('Database visualization error:', error);
            throw new Error(`Failed to visualize database: ${error.message}`);
        }
    }

    /**
     * Fallback parser using a regex-based approach to parse SQL schema.
     * @param {string} schemaSql - The SQL schema string to parse.
     * @returns {Promise<TypedJsonSchema>} - The parsed schema as a typed JSON object.
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
                            targetColumn: foreignKeyMatch[2],
                        });
                    }

                    tablesMap[currentTable].columns[columnName] = {
                        type: columnType,
                        primaryKey: primaryKeyRegex.test(constraints),
                        foreignKey: foreignKeyRegex.test(constraints),
                        unique: uniqueRegex.test(constraints),
                        notNull: notNullRegex.test(constraints),
                        default: this.extractDefault(constraints),
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
                constraints: this.buildConstraintsArray(columnData),
            })),
        }));

        return {
            tables,
            foreignKeys,
            metadata: {
                dialect: 'postgresql',
                parsedAt: new Date(),
                source: 'fallback',
            },
        };
    }

    /**
     * Converts a typed JSON schema to DBML (Database Markup Language) format.
     * @param {TypedJsonSchema} typedSchema - The typed JSON schema to convert.
     * @param {string} databaseName - The name of the database for the DBML project.
     * @returns {string} - The DBML code as a string.
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

                    // Add FK reference inline if this column is a foreign key (only for single-column FKs)
                    const fkRef = typedSchema.foreignKeys.find(
                        (fk) =>
                            fk.sourceTable === table.name &&
                            typeof fk.sourceColumn === 'string' &&
                            fk.sourceColumn === column.name,
                    );
                    if (fkRef && typeof fkRef.targetColumn === 'string') {
                        attributes.push(`ref: > ${fkRef.targetTable}.${fkRef.targetColumn}`);
                    }

                    if (attributes.length > 0) {
                        columnLine += ` [${attributes.join(', ')}]`;
                    }

                    dbml += columnLine + '\n';
                }

                dbml += `}\n\n`;
            }

            // Add relationships (foreign keys) - for all FKs including multi-column ones
            for (const fk of typedSchema.foreignKeys) {
                const sourceColumns = Array.isArray(fk.sourceColumn)
                    ? fk.sourceColumn
                    : [fk.sourceColumn];
                const targetColumns = Array.isArray(fk.targetColumn)
                    ? fk.targetColumn
                    : [fk.targetColumn];

                // For multi-column FKs, create composite reference
                if (sourceColumns.length > 1 && targetColumns.length > 1) {
                    dbml += `Ref: (${sourceColumns.map((col) => `${fk.sourceTable}.${col}`).join(', ')}) > (${targetColumns.map((col) => `${fk.targetTable}.${col}`).join(', ')})`;
                } else {
                    dbml += `Ref: ${fk.sourceTable}.${sourceColumns[0]} > ${fk.targetTable}.${targetColumns[0]}`;
                }

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
     * Maps a typed JSON schema to the internal DTO format for ER diagram visualization.
     * @param {TypedJsonSchema} typedSchema - The typed JSON schema to map.
     * @returns {{ tables: TableNodeDto[], relationships: RelationshipDto[] }} - The mapped tables and relationships.
     */
    private mapTypedSchemaToDto(typedSchema: TypedJsonSchema): {
        tables: TableNodeDto[];
        relationships: RelationshipDto[];
    } {
        const tables: TableNodeDto[] = [];
        const relationships: RelationshipDto[] = [];

        // Map tables
        for (const table of typedSchema.tables) {
            const columns: ColumnDto[] = table.columns.map((column) => ({
                name: column.name,
                type: column.type,
                isPrimaryKey: column.isPrimaryKey,
                isForeignKey: column.isForeignKey,
                isUnique: column.isUnique,
                isNullable: column.isNullable,
                constraints: column.constraints?.join(' ') || '',
            }));

            tables.push({
                id: table.name,
                name: table.name,
                columns,
                x: 0,
                y: 0,
                width: 200,
                height: Math.max(120, 30 + columns.length * 25),
            });
        }

        // Map relationships from foreign keys
        for (const fk of typedSchema.foreignKeys) {
            const sourceColumns = Array.isArray(fk.sourceColumn)
                ? fk.sourceColumn
                : [fk.sourceColumn];
            const targetColumns = Array.isArray(fk.targetColumn)
                ? fk.targetColumn
                : [fk.targetColumn];

            relationships.push({
                id: `${fk.sourceTable}.${sourceColumns.join('_')}_to_${fk.targetTable}.${targetColumns.join('_')}`,
                fromTable: fk.sourceTable,
                fromColumn: fk.sourceColumn, // Keep original format (string | string[])
                toTable: fk.targetTable,
                toColumn: fk.targetColumn, // Keep original format (string | string[])
                type: 'many-to-one',
                label: fk.constraintName || '',
            });
        }

        return { tables, relationships };
    }

    /**
     * Calculates the positions of tables and relationships for ER diagram layout.
     * @param {{ tables: TableNodeDto[], relationships: RelationshipDto[] }} data - The tables and relationships to position.
     * @returns {{ tables: TableNodeDto[], relationships: RelationshipDto[] }} - The positioned tables and relationships.
     */
    private calculatePositions(data: {
        tables: TableNodeDto[];
        relationships: RelationshipDto[];
    }): { tables: TableNodeDto[]; relationships: RelationshipDto[] } {
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

            table.x = startX + col * gridWidth;
            table.y = startY + row * gridHeight;
            table.height = Math.max(120, 50 + table.columns.length * 30);
        });

        return { tables, relationships };
    }

    /**
     * Extracts the default value from a column constraints string.
     * @param {string} constraints - The constraints string from the column definition.
     * @returns {string|null} - The extracted default value or null if not present.
     */
    private extractDefault(constraints: string): string | null {
        const defaultMatch = constraints.match(/DEFAULT\s+([^,\s]+)/i);
        return defaultMatch ? defaultMatch[1].replace(/['"]/g, '') : null;
    }

    /**
     * Maps a SQL data type string to a DBML-compatible type string.
     * @param {string} sqlType - The SQL data type string.
     * @returns {string} - The DBML-compatible type string.
     */
    private mapSqlTypeToDbml(sqlType: string): string {
        const typeMap: { [key: string]: string } = {
            INTEGER: 'int',
            SERIAL: 'int',
            BIGINT: 'bigint',
            VARCHAR: 'varchar',
            TEXT: 'text',
            BOOLEAN: 'boolean',
            TIMESTAMP: 'timestamp',
            DATE: 'date',
            DECIMAL: 'decimal',
            FLOAT: 'float',
            REAL: 'real',
        };

        const upperType = sqlType.toUpperCase().split('(')[0];
        return typeMap[upperType] || sqlType.toLowerCase();
    }

    /**
     * Normalizes a column type string to a standard format.
     * @param {string} type - The column type string.
     * @returns {string} - The normalized column type.
     */
    private normalizeColumnType(type: string): string {
        const typeMap: { [key: string]: string } = {
            INTEGER: 'INT',
            SERIAL: 'INT',
            BIGINT: 'BIGINT',
            VARCHAR: 'VARCHAR',
            TEXT: 'TEXT',
            BOOLEAN: 'BOOL',
            TIMESTAMP: 'TIMESTAMP',
            DATE: 'DATE',
            DECIMAL: 'DECIMAL',
            FLOAT: 'FLOAT',
            REAL: 'FLOAT',
        };

        const upperType = type.toUpperCase().split('(')[0];
        return typeMap[upperType] || type;
    }

    /**
     * Builds a string of constraints for a column from its data object.
     * @param {any} columnData - The column data object.
     * @returns {string} - The constraints as a single string.
     */
    private buildConstraintsString(columnData: any): string {
        const constraints: string[] = [];

        if (columnData.primaryKey) constraints.push('PRIMARY KEY');
        if (columnData.foreignKey) constraints.push('FOREIGN KEY');
        if (columnData.unique) constraints.push('UNIQUE');
        if (columnData.notNull) constraints.push('NOT NULL');
        if (columnData.default) constraints.push(`DEFAULT ${columnData.default}`);

        return constraints.join(' ');
    }

    /**
     * Builds an array of constraint strings for a column from its data object.
     * @param {any} columnData - The column data object.
     * @returns {string[]} - The constraints as an array of strings.
     */
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
