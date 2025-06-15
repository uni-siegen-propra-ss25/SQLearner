import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InsertTableDataDto {
    @ApiProperty({
        description: 'The name of the table to insert data into',
        example: 'users'
    })
    @IsString()
    @IsNotEmpty()
    tableName: string;

    @ApiProperty({
        description: 'Array of column names',
        example: ['id', 'name', 'email']
    })
    @IsArray()
    @IsString({ each: true })
    columns: string[];

    @ApiProperty({
        description: 'Array of values to insert',
        example: [['1', 'John Doe', 'john@example.com']]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Array)
    values: any[][];
}
