import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

export class UpdateTableDto {
    @ApiProperty({ 
        description: 'New name for the table',
        example: 'users',
        minLength: 1,
        maxLength: 63,
        required: false
    })
    @IsString()
    @MinLength(1)
    @MaxLength(63)
    @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
        message: 'Table name must start with a letter and contain only letters, numbers, and underscores'
    })
    @IsOptional()
    name?: string;

    @ApiProperty({ 
        description: 'New description for the table',
        example: 'Stores user information',
        required: false
    })
    @IsString()
    @IsOptional()
    description?: string;
}
