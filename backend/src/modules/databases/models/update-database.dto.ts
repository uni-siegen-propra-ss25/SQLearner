import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDatabaseDto {
    @ApiProperty({
        description: 'The updated name of the database.',
        example: 'Customer Orders Database',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiProperty({
        description: 'The updated description of the database.',
        example: 'A database for managing customer orders and products.',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
} 