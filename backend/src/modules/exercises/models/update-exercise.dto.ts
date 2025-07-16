import { PartialType } from '@nestjs/swagger';
import { CreateExerciseDto } from './create-exercise.dto';
import { IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {
    @ApiProperty({ description: 'The ID of the exercise (ignored in updates)', required: false })
    @IsNumber()
    @IsOptional()
    id?: number;
}
