import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RunQueryDto {
    @ApiProperty({ description: 'SQL query to execute' })
    @IsString()
    @IsNotEmpty()
    query: string;
}

export interface QueryResult {
    columns: string[];
    rows: any[];
    rowCount?: number;
    command?: string;
    error?: string;
}
