import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

export class RowDataDto {
    @ApiProperty({
        description: 'Data object containing column names as keys and their values',
        example: {
            name: 'John Doe',
            email: 'john@example.com',
            age: 25
        }
    })
    @IsObject()
    data: Record<string, any>;

    @ApiProperty({
        description: 'Optional WHERE clause for UPDATE operations',
        required: false,
        example: 'id = 1'
    })
    @IsOptional()
    whereClause?: string;
} 