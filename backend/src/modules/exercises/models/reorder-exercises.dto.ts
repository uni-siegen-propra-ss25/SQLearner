import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ExerciseOrderItem {
    @ApiProperty({ description: 'The exercise ID' })
    @IsNumber()
    id: number;

    @ApiProperty({ description: 'The new order position' })
    order: number;
}

export class ReorderExercisesDto {
    @ApiProperty({ 
        description: 'Array of exercise IDs with their new order positions',
        type: [ExerciseOrderItem]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExerciseOrderItem)
    exercises: ExerciseOrderItem[];
} 