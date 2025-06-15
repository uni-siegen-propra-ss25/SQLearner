import { ApiProperty } from '@nestjs/swagger';

export interface ErrorDetail {
    code: string;
    message: string;
    field?: string;
    value?: string;
}

export interface ErrorResponse {
    statusCode: number;
    message: string;
    error: string;
    details?: ErrorDetail[];
}

export class SqlError implements ErrorDetail {
    @ApiProperty({ description: 'PostgreSQL error code' })
    code: string;

    @ApiProperty({ description: 'Error message' })
    message: string;

    @ApiProperty({ description: 'Affected field', required: false })
    field?: string;

    @ApiProperty({ description: 'The value that caused the error', required: false })
    value?: string;

    @ApiProperty({ description: 'PostgreSQL error position', required: false })
    position?: string;

    @ApiProperty({ description: 'PostgreSQL error hint', required: false })
    hint?: string;

    @ApiProperty({ description: 'Affected schema', required: false })
    schema?: string;

    @ApiProperty({ description: 'Affected table', required: false })
    table?: string;

    @ApiProperty({ description: 'Affected column', required: false })
    column?: string;

    @ApiProperty({ description: 'Affected constraint', required: false })
    constraint?: string;
}
