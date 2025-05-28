import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsUUID, IsNumber } from 'class-validator';

export class CreateTopicDto {
    @ApiProperty({ description: 'The chapter ID this topic belongs to' })
    @IsNumber()
    @IsNotEmpty()
    chapterId: number;

    @ApiProperty({ description: 'The title of the topic' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'The description of the topic' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'The order of the topic within its chapter', required: false })
    @IsInt()
    @IsOptional()
    order?: number;
}
