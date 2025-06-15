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

export class TableDataDto {
    tableName: string;
    columns: string[];
    values: any[][];

    constructor(data: {tableName: string; columns: string[]; values: any[][]}) {
        this.tableName = data.tableName;
        this.columns = data.columns;
        // Ensure values is always an array of arrays
        this.values = data.values.map(rowData => {
            // If rowData is already an array of the correct length, use it
            if (Array.isArray(rowData) && rowData.length === data.columns.length) {
                return rowData;
            }
            // If it's an array but wrong length, or not an array, create a new array
            return data.columns.map((_, index) => Array.isArray(rowData) ? rowData[index] : rowData);
        });
    }
}
