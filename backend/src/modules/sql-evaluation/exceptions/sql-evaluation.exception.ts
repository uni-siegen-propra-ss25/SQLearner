export class SqlEvaluationException extends Error {
    constructor(
        message: string,
        public readonly type: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'SqlEvaluationException';
    }
}
