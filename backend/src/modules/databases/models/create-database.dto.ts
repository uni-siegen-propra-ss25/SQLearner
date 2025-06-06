import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateDatabaseDto {
    @ApiProperty({ description: 'The name of the database' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Optional description of the database', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'The SQL schema/dump for this database', required: false })
    @IsString()
    @IsOptional()
    schemaSql?: string;

    @ApiProperty({ 
        description: 'Example SQL queries for this database (JSON array of queries)',
        required: false,
        example: [
            {
                "name": "Select all users",
                "query": "SELECT * FROM users",
                "description": "Retrieves all users from the database"
            }
        ]
    })
    @IsString()
    @IsOptional()
    exampleQueries?: string;
}
