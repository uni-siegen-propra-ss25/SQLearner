/**
 * Data transfer object representing a column in a table for ER diagram visualization.
 * @property {string} name - The name of the column.
 * @property {string} type - The SQL data type of the column.
 * @property {boolean} isPrimaryKey - Whether the column is a primary key.
 * @property {boolean} isForeignKey - Whether the column is a foreign key.
 * @property {boolean} isUnique - Whether the column has a unique constraint.
 * @property {boolean} isNullable - Whether the column allows null values.
 * @property {string} constraints - String representation of all constraints for the column.
 */
export class ColumnDto {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isUnique: boolean;
    isNullable: boolean;
    constraints: string;
}

/**
 * Data transfer object representing a table node in the ER diagram.
 * @property {string} id - Unique identifier for the table node.
 * @property {string} name - The name of the table.
 * @property {ColumnDto[]} columns - Array of columns in the table.
 * @property {number} x - X position for diagram layout.
 * @property {number} y - Y position for diagram layout.
 * @property {number} width - Width of the table node in the diagram.
 * @property {number} height - Height of the table node in the diagram.
 */
export class TableNodeDto {
    id: string;
    name: string;
    columns: ColumnDto[];
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Data transfer object representing a relationship (edge) between tables in the ER diagram.
 * @property {string} id - Unique identifier for the relationship.
 * @property {string} fromTable - Name of the source table.
 * @property {string | string[]} fromColumn - Name(s) of the source column(s). Single column as string, multi-column as array.
 * @property {string} toTable - Name of the target table.
 * @property {string | string[]} toColumn - Name(s) of the target column(s). Single column as string, multi-column as array.
 * @property {'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'} type - Type of relationship.
 * @property {string} label - Optional label for the relationship (e.g., constraint name).
 */
export class RelationshipDto {
    id: string;
    fromTable: string;
    fromColumn: string | string[];
    toTable: string;
    toColumn: string | string[];
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    label: string;
}

/**
 * Metadata for the ER diagram, such as database name and table/relationship counts.
 * @property {string} databaseName - The name of the database.
 * @property {number} tableCount - Number of tables in the diagram.
 * @property {number} relationshipCount - Number of relationships in the diagram.
 */
export class ERDiagramMetadataDto {
    databaseName: string;
    tableCount: number;
    relationshipCount: number;
}

/**
 * Data transfer object representing the entire ER diagram, including tables, relationships, and metadata.
 * @property {TableNodeDto[]} tables - Array of table nodes in the diagram.
 * @property {RelationshipDto[]} relationships - Array of relationships (edges) in the diagram.
 * @property {ERDiagramMetadataDto} metadata - Metadata about the diagram.
 * @property {string} dbmlCode - The DBML code representation of the schema.
 * @property {any} [jsonSchema] - Optional: The full typed JSON schema.
 * @property {string} [svgContent] - Optional: SVG content for the diagram (if available).
 */
export class ERDiagramDto {
    tables: TableNodeDto[];
    relationships: RelationshipDto[];
    metadata: ERDiagramMetadataDto;
    dbmlCode: string;
    jsonSchema?: any;
    svgContent?: string;
}

/**
 * Data transfer object for parsing a schema string into an ER diagram.
 * @property {string} schema - The SQL schema string to parse.
 * @property {string} [name] - Optional name for the schema/database.
 */
export class ParseSchemaDto {
    schema: string;
    name?: string;
}
