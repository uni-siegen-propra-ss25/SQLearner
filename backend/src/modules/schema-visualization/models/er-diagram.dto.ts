export class ColumnDto {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isUnique: boolean;
    isNullable: boolean;
    constraints: string;
}

export class TableNodeDto {
    id: string;
    name: string;
    columns: ColumnDto[];
    x: number;
    y: number;
    width: number;
    height: number;
}

export class RelationshipDto {
    id: string;
    fromTable: string;
    fromColumn: string;
    toTable: string;
    toColumn: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    label: string;
}

export class ERDiagramMetadataDto {
    databaseName: string;
    tableCount: number;
    relationshipCount: number;
}

export class ERDiagramDto {
    tables: TableNodeDto[];
    relationships: RelationshipDto[];
    metadata: ERDiagramMetadataDto;
    dbmlCode: string;
    jsonSchema?: any;
    svgContent?: string;
}

export class ParseSchemaDto {
    schema: string;
    name?: string;
}