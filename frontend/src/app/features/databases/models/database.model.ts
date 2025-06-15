export interface Database {
    id: number;
    name: string;
    description?: string;
    schemaSql?: string;
    createdAt: Date;
    updatedAt: Date;
    tables?: DatabaseTable[];
}

export interface DatabaseTable {
    id: number;
    name: string;
    description?: string;
    createSql: string;
    databaseId: number;
    columns: TableColumn[];
    createdAt: Date;
    updatedAt: Date;
}

export interface TableColumn {
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    references?: {
        table: string;
        column: string;
    };
}

export interface CreateDatabaseDto {
    name: string;
    description?: string;
    schemaSql?: string;
}

export interface UpdateDatabaseDto {
    name?: string;
    description?: string;
    schemaSql?: string;
}

export interface CreateTableDto {
    name: string;
    description?: string;
    columns: {
        name: string;
        type: string;
        nullable: boolean;
        isPrimaryKey: boolean;
        isForeignKey?: boolean;
        defaultValue?: string;
        autoIncrement?: boolean;
        referencesTable?: string;
        referencesColumn?: string;
    }[];
}

export interface UpdateTableDto {
    name?: string;
    createSql?: string;
    description?: string;
}

export interface TableDataDto {
    columns: TableColumn[];
    rows: any[];
    totalRows: number;
}
