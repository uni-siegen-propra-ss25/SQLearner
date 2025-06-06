import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateChapterDto {
    @ApiProperty({ description: 'The title of the chapter' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'The description of the chapter', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'The order of the chapter in the sequence', required: false })
    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;
}
