export interface Database {
    id: number;
    name: string;
    description?: string;
    schemaSql?: string;
    ownerId: number;
    owner?: {
        id: number;
        firstName: string;
        lastName: string;
    };
    exercises?: {
        id: number;
        title: string;
        type: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateDatabaseDto {
    name: string;
    description?: string;
    schemaSql?: string;
}

export interface UpdateDatabaseDto extends Partial<CreateDatabaseDto> {}
