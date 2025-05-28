import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

interface ITopicOrderItem {
    id: number;
    order: number;
}

export class TopicOrderItem implements ITopicOrderItem {
    @ApiProperty({ description: 'The topic ID' })
    @IsNumber()
    @Type(() => Number)
    id: number;

    @ApiProperty({ description: 'The new order position' })
    @IsNumber()
    @Type(() => Number)
    order: number;
}

interface IReorderTopicsDto {
    topics: ITopicOrderItem[];
}

export class ReorderTopicsDto implements IReorderTopicsDto {
    @ApiProperty({
        description: 'Array of topic IDs with their new order positions',
        type: [TopicOrderItem],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TopicOrderItem)
    topics: TopicOrderItem[];
}
