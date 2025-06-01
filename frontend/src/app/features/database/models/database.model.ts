export interface Database {
    id: number;
    name: string;
    description: string;
    schemaSql: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: number;
}

export interface CreateDatabaseDto {
    name: string;
    description: string;
    schemaSql: string;
}

export interface UpdateDatabaseDto {
    name?: string;
    description?: string;
    schemaSql?: string;
}
