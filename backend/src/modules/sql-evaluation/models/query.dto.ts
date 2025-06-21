import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class ExampleQueryDto {
    @ApiProperty({
        description: 'Name/title of the example query',
        example: 'Find all active users'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The SQL query text',
        example: 'SELECT * FROM users WHERE active = true'
    })
    @IsString()
    @IsNotEmpty()
    query: string;

    @ApiProperty({
        description: 'Detailed description of what the query does',
        required: false,
        example: 'Retrieves all users that have an active status'
    })
    @IsString()
    @IsOptional()
    description?: string;
}

export class ExecuteQueryDto {
    @ApiProperty({
        description: 'The SQL query to execute',
        example: 'SELECT * FROM users WHERE active = true'
    })
    @IsString()
    @IsNotEmpty()
    query: string;

    @ApiProperty({
        description: 'Parameters for the query',
        required: false,
        example: { userId: 1, status: true }
    })
    @IsOptional()
    params?: Record<string, any>;
}

export class QueryResultDto {
    @ApiProperty({
        description: 'Column names of the result set',
        example: ['id', 'name', 'email']
    })
    @IsArray()
    @IsString({ each: true })
    columns: string[];

    @ApiProperty({
        description: 'Result rows',
        example: [{ id: 1, name: 'John', email: 'john@example.com' }]
    })
    rows: Record<string, any>[];

    @ApiProperty({
        description: 'Number of rows returned',
        example: 1
    })
    rowCount: number;

    @ApiProperty({
        description: 'Query execution time in milliseconds',
        example: 42
    })
    executionTimeMs: number;
}
