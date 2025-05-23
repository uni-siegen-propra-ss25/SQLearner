import { PartialType } from '@nestjs/swagger';
import { CreateExerciseDto } from './create-exercise.dto';
import { AnswerOption } from '@prisma/client';

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {
    options?: AnswerOption[];
} 