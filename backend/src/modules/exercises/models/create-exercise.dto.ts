import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsEnum, ValidateNested, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty, ExerciseType } from '@prisma/client';

class AnswerOptionDto {
    @ApiProperty({ description: 'The text of the choice' })
    @IsString()
    @IsNotEmpty()
    text: string;

    @ApiProperty({ description: 'Whether this choice is correct' })
    @IsBoolean()
    isCorrect: boolean;

    @ApiProperty({ description: 'The order of this answer option', required: false })
    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;
}

export class CreateExerciseDto {
    @ApiProperty({ description: 'The topic ID this exercise belongs to' })
    @IsNumber()
    @IsNotEmpty()
    topicId: number;

    @ApiProperty({ description: 'The type of exercise', enum: ExerciseType })
    @IsEnum(ExerciseType)
    type: ExerciseType;

    @ApiProperty({ description: 'The title of the exercise' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'The description of the exercise' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ description: 'The difficulty level of the exercise', enum: Difficulty })
    @IsEnum(Difficulty)
    difficulty: Difficulty;

    @ApiProperty({ description: 'The order of the exercise within its topic', required: false })
    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;

    @ApiProperty({ description: 'The database ID for SQL exercises', required: false })
    @IsNumber()
    @IsOptional()
    databaseId?: number;

    @ApiProperty({ description: 'The SQL solution query', required: false })
    @IsString()
    @IsOptional()
    querySolution?: string;

    @ApiProperty({ description: 'The answers for choice exercises', required: false, type: [AnswerOptionDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AnswerOptionDto)
    @IsOptional()
    answers?: AnswerOptionDto[];
} 