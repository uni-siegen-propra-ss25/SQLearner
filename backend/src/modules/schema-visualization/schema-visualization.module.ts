import { Module } from '@nestjs/common';
import { SchemaVisualizationController } from './controllers/schema-visualization.controller';
import { SchemaVisualizationService } from './services/schema-visualization.service';
import { DatabasesModule } from '../databases/databases.module';

@Module({
    imports: [DatabasesModule],
    controllers: [SchemaVisualizationController],
    providers: [SchemaVisualizationService],
    exports: [SchemaVisualizationService],
})
export class SchemaVisualizationModule {}
