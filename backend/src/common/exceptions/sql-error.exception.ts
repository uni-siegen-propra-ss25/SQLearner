import { HttpException, HttpStatus } from '@nestjs/common';

export class SqlErrorException extends HttpException {
    constructor(error: Error) {
        super(
            {
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'SQL Error',
                detail: error.message,
                error: 'Bad Request',
            },
            HttpStatus.BAD_REQUEST,
        );
    }
}
