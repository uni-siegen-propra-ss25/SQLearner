import { HttpException, HttpStatus } from '@nestjs/common';

interface SqlErrorDetails {
    message: string;
    name?: string;
    code?: string;
    detail?: string;
    stack?: string;
}

export class SqlErrorException extends HttpException {
    constructor(error: SqlErrorDetails) {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message: error.message,
                detail: error.detail,
                code: error.code,
                name: error.name || 'DatabaseError',
                stack: error.stack,
                error: 'Bad Request',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
