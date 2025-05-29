import { ApiProperty } from '@nestjs/swagger';

export class Database {
    @ApiProperty({ description: 'Unique identifier of the database' })
    id: number;

    @ApiProperty({ description: 'Name of the database' })
    name: string;

    @ApiProperty({ description: 'Description of the database' })
    description: string;

    @ApiProperty({ description: 'SQL schema of the database' })
    schemaSql: string;

    @ApiProperty({ description: 'Creation date of the database' })
    createdAt: Date;

    @ApiProperty({ description: 'Last update date of the database' })
    updatedAt: Date;

    @ApiProperty({ description: 'ID of the tutor who created the database' })
    ownerId: number;
} 