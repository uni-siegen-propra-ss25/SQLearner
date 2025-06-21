

export class DatabaseDto {
    id: number;
    name: string;
    description?: string;
    schemaSql?: string;
    createdAt: Date;
    updatedAt: Date;
}
