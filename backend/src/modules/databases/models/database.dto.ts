import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class DatabaseDto {
    @ApiProperty({ description: 'Unique identifier of the database' })
    @IsNumber()
    id: number;

    @ApiProperty({ description: 'Name of the database' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'Description of the database', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'SQL schema of the database', required: false })
    @IsString()
    @IsOptional()
    schemaSql?: string;

    @ApiProperty({ description: 'ID of the tutor who created the database' })
    @IsNumber()
    ownerId: number;

    @ApiProperty({ description: 'Creation date of the database' })
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty({ description: 'Last update date of the database' })
    @IsDate()
    @Type(() => Date)
    updatedAt: Date;

    @ApiProperty({ 
        description: 'Tables in this database',
        required: false
    })
    @ValidateNested({ each: true })
    @IsOptional()
    tables?: any[]; // Type will be properly set when used with Prisma

    @ApiProperty({ 
        description: 'Exercises using this database',
        required: false
    })
    @ValidateNested({ each: true })
    @IsOptional()
    exercises?: any[]; // Type will be properly set when used with Prisma
}
