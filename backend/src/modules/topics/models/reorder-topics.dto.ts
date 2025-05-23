import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TopicOrderItem {
    @ApiProperty({ description: 'The topic ID' })
    id: string;

    @ApiProperty({ description: 'The new order position' })
    order: number;
}

export class ReorderTopicsDto {
    @ApiProperty({ 
        description: 'Array of topic IDs with their new order positions',
        type: [TopicOrderItem]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TopicOrderItem)
    topics: TopicOrderItem[];
} 