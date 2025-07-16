export interface DatabaseColumn {
    name: string;
    type: string;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isNullable: boolean;
    defaultValue: any;
}

export interface DatabaseTable {
    id: number;
    name: string;
    columns: DatabaseColumn[];
    databaseId: number;
    rowCount?: number;
}
