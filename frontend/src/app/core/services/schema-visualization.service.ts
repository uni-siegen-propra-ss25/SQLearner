import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
export interface ColumnDto {
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
export interface TableNodeDto {
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
 * @property {string} fromColumn - Name of the source column.
 * @property {string} toTable - Name of the target table.
 * @property {string} toColumn - Name of the target column.
 * @property {'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'} type - Type of relationship.
 * @property {string} label - Optional label for the relationship (e.g., constraint name).
 */
export interface RelationshipDto {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  label: string;
}

/**
 * Metadata for the ER diagram, such as database name and table/relationship counts.
 * @property {string} databaseName - The name of the database.
 * @property {number} tableCount - Number of tables in the diagram.
 * @property {number} relationshipCount - Number of relationships in the diagram.
 */
export interface ERDiagramMetadataDto {
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
export interface ERDiagramDto {
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
export interface ParseSchemaDto {
  schema: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SchemaVisualizationService {
  private readonly baseUrl = `${environment.apiUrl}/schema-visualization`;

  constructor(private http: HttpClient) {}

  /**
   * Parse a schema string (DDL) and return ER diagram data.
   * @param {ParseSchemaDto} parseSchemaDto - DTO containing the schema string and optional name.
   * @returns {Observable<ERDiagramDto>} - Observable emitting the ER diagram data.
   */
  parseSchemaString(parseSchemaDto: ParseSchemaDto): Observable<ERDiagramDto> {
    console.log('🌐 [AUDIT] Frontend Service - parseSchemaString():');
    console.log('   Request URL:', `${this.baseUrl}/parse-schema`);
    console.log('   Request Data:', {
      schema: parseSchemaDto.schema?.substring(0, 100) + '...',
      name: parseSchemaDto.name,
      schemaLength: parseSchemaDto.schema?.length || 0
    });
    
    const request = this.http.post<ERDiagramDto>(`${this.baseUrl}/parse-schema`, parseSchemaDto);
    
    // Add response logging
    return request.pipe(
      tap(response => {
        console.log('📨 [AUDIT] Frontend Service - Response received:');
        console.log('   Tables Count:', response.tables?.length || 0);
        console.log('   Relationships Count:', response.relationships?.length || 0);
        console.log('   DBML Code Length:', response.dbmlCode?.length || 0);
        console.log('   Response Tables:', response.tables?.map(t => ({ name: t.name, columns: t.columns?.length || 0 })));
        console.log('   Response Relationships:', response.relationships?.map(r => `${r.fromTable}.${r.fromColumn} -> ${r.toTable}.${r.toColumn}`));
      }),
      catchError(error => {
        console.error('❌ [AUDIT] Frontend Service - Request failed:', error);
        throw error;
      })
    );
  }

  /**
   * Get ER diagram data for a specific database.
   * @param {number} databaseId - The ID of the database.
   * @returns {Observable<ERDiagramDto>} - Observable emitting the ER diagram data.
   */
  visualizeDatabase(databaseId: number): Observable<ERDiagramDto> {
    return this.http.get<ERDiagramDto>(`${this.baseUrl}/database/${databaseId}`);
  }
}
