import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ColumnDto {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isNullable: boolean;
  constraints: string;
}

export interface TableNodeDto {
  id: string;
  name: string;
  columns: ColumnDto[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RelationshipDto {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  label: string;
}

export interface ERDiagramMetadataDto {
  databaseName: string;
  tableCount: number;
  relationshipCount: number;
}

export interface ERDiagramDto {
  tables: TableNodeDto[];
  relationships: RelationshipDto[];
  metadata: ERDiagramMetadataDto;
  dbmlCode: string;
  jsonSchema?: any;
  svgContent?: string;
}

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
   * Parse a schema string (DDL) and return ER diagram data
   */
  parseSchemaString(parseSchemaDto: ParseSchemaDto): Observable<ERDiagramDto> {
    return this.http.post<ERDiagramDto>(`${this.baseUrl}/parse-schema`, parseSchemaDto);
  }

  /**
   * Get ER diagram data for a specific database
   */
  visualizeDatabase(databaseId: number): Observable<ERDiagramDto> {
    return this.http.get<ERDiagramDto>(`${this.baseUrl}/database/${databaseId}`);
  }
}
