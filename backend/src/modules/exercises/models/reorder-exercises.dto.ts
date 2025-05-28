import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

interface IExerciseOrderItem {
    id: number;
    order: number;
}

export class ExerciseOrderItem implements IExerciseOrderItem {
    @ApiProperty({ description: 'The exercise ID' })
    @IsNumber()
    @Type(() => Number)
    id: number;

    @ApiProperty({ description: 'The new order position' })
    @IsNumber()
    @Type(() => Number)
    order: number;
}

interface IReorderExercisesDto {
    exercises: IExerciseOrderItem[];
}

export class ReorderExercisesDto implements IReorderExercisesDto {
    @ApiProperty({
        description: 'Array of exercise IDs with their new order positions',
        type: [ExerciseOrderItem],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExerciseOrderItem)
    exercises: ExerciseOrderItem[];
}
