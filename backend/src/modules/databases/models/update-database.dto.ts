import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateDatabaseDto {
    @ApiProperty({ description: 'The name of the database', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: 'The description of the database', required: false })
    @IsString()
    @IsOptional()
    description?: string;
}
