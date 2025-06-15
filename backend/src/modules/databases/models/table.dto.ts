import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, ValidateNested, IsEnum, ValidateIf, Matches, IsArray, MinLength, MaxLength, IsInt, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// Common SQL data types with descriptions
export enum SqlDataType {
    INT = 'INT',
    VARCHAR = 'VARCHAR',
    TEXT = 'TEXT',
    DATE = 'DATE',
    TIMESTAMP = 'TIMESTAMP',
    BOOLEAN = 'BOOLEAN',
    DECIMAL = 'DECIMAL',
    FLOAT = 'FLOAT',
    DOUBLE = 'DOUBLE',
}

export class ColumnMetadata {
    @ApiProperty({ description: 'Maximum length for VARCHAR/TEXT', required: false })
    @IsInt()
    @Min(1)
    @Max(65535)
    @IsOptional()
    maxLength?: number;

    @ApiProperty({ description: 'Precision for DECIMAL/NUMERIC', required: false })
    @IsInt()
    @Min(1)
    @Max(65)
    @IsOptional()
    precision?: number;

    @ApiProperty({ description: 'Scale for DECIMAL/NUMERIC', required: false })
    @IsInt()
    @Min(0)
    @Max(30)
    @IsOptional()
    scale?: number;
}

export class TableColumnDto {
    @ApiProperty({ 
        description: 'Name of the column',
        example: 'user_id',
        minLength: 1,
        maxLength: 63
    })
    @IsString()
    @MinLength(1)
    @MaxLength(63)
    @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
        message: 'Column name must start with a letter and contain only letters, numbers, and underscores'
    })
    name: string;

    @ApiProperty({ 
        description: 'SQL type of the column',
        enum: SqlDataType,
        example: 'VARCHAR'
    })
    @IsEnum(SqlDataType, {
        message: 'Invalid SQL type. Must be one of: ' + Object.values(SqlDataType).join(', ')
    })
    type: SqlDataType;

    @ApiProperty({ 
        description: 'Whether the column can be null',
        default: true
    })
    @IsBoolean()
    nullable: boolean = true;

    @ApiProperty({ 
        description: 'Whether this is a primary key column',
        default: false
    })
    @IsBoolean()
    isPrimaryKey: boolean = false;

    @ApiProperty({ 
        description: 'Whether this is a foreign key column',
        default: false
    })
    @IsBoolean()
    @IsOptional()
    isForeignKey?: boolean = false;

    @ApiProperty({ 
        description: 'Default value for the column', 
        required: false,
        example: '0'
    })
    @IsString()
    @IsOptional()
    defaultValue?: string;

    @ApiProperty({ 
        description: 'Whether this column auto-increments (only for INT)', 
        required: false,
        default: false
    })
    @IsBoolean()
    @IsOptional()
    autoIncrement?: boolean;

    @ApiProperty({ 
        description: 'Referenced table for foreign keys', 
        required: false,
        example: 'users'
    })
    @IsString()
    @IsOptional()
    @ValidateIf(o => o.isForeignKey === true)
    referencesTable?: string;

    @ApiProperty({ 
        description: 'Referenced column for foreign keys', 
        required: false,
        example: 'id'
    })
    @IsString()
    @IsOptional()
    @ValidateIf(o => o.isForeignKey === true)
    referencesColumn?: string;

    @ApiProperty({
        description: 'Column metadata for types that require it',
        required: false
    })
    @ValidateNested()
    @Type(() => ColumnMetadata)
    @IsOptional()
    metadata?: ColumnMetadata;
}

export class CreateTableDto {
    @ApiProperty({ 
        description: 'Name of the table',
        example: 'users',
        minLength: 1,
        maxLength: 63
    })
    @IsString()
    @MinLength(1)
    @MaxLength(63)
    @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
        message: 'Table name must start with a letter and contain only letters, numbers, and underscores'
    })
    name: string;

    @ApiProperty({ 
        description: 'Description of the table', 
        required: false,
        example: 'Stores user information'
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ 
        description: 'Column definitions for the table', 
        type: [TableColumnDto],
        minItems: 1
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TableColumnDto)
    columns: TableColumnDto[];
}

export class UpdateTableDto {
    @ApiProperty({ 
        description: 'Updated description of the table', 
        required: false,
        example: 'Stores user profile information'
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ 
        description: 'Updated column definitions', 
        type: [TableColumnDto], 
        required: false
    })
    @ValidateNested({ each: true })
    @Type(() => TableColumnDto)
    @IsOptional()
    columns?: TableColumnDto[];
}
