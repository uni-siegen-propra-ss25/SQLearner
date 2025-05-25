import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
} 