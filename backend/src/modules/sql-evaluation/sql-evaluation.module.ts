import { Module } from '@nestjs/common';
import { SqlEvaluationService } from './services/sql-evaluation.service';
import { QueryExecutorService } from './services/query-executor.service';
import { ResultComparatorService } from './services/result-comparator.service';
import { AiFeedbackService } from './services/ai-feedback.service';
import { DatabasesModule } from '../databases/databases.module';

@Module({
    imports: [DatabasesModule],
    providers: [
        SqlEvaluationService,
        QueryExecutorService,
        ResultComparatorService,
        AiFeedbackService
    ],
    exports: [SqlEvaluationService]
})
export class SqlEvaluationModule {}
