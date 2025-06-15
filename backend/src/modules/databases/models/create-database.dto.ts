import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateDatabaseDto {
    @ApiProperty({ 
        description: 'The name of the database',
        example: 'library_db',
        minLength: 3,
        maxLength: 63
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(63)
    @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
        message: 'Database name must start with a letter and contain only letters, numbers, and underscores'
    })
    name: string;

    @ApiProperty({ 
        description: 'Description of the database and its purpose',
        example: 'A library management database with books, authors, and borrowers',
        required: false 
    })
    @IsString()
    @IsOptional()
    @MaxLength(1000)
    description?: string;

    @ApiProperty({ 
        description: 'The SQL schema/dump for this database', 
        required: false,
        example: `
            CREATE TABLE authors (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL
            );
        `
    })
    @IsString()
    @IsOptional()
    schemaSql?: string;
}
