import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChapterOrderItem {
    @ApiProperty({ description: 'The chapter ID' })
    id: number;

    @ApiProperty({ description: 'The new order position' })
    order: number;
}

export class ReorderChaptersDto {
    @ApiProperty({ 
        description: 'Array of chapter IDs with their new order positions',
        type: [ChapterOrderItem]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ChapterOrderItem)
    chapters: ChapterOrderItem[];
} 