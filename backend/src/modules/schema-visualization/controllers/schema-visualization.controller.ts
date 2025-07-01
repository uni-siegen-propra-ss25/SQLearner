import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SchemaVisualizationService } from '../services/schema-visualization.service';
import { ERDiagramDto, ParseSchemaDto } from '../models/er-diagram.dto';

@Controller('schema-visualization')
export class SchemaVisualizationController {
    constructor(private readonly schemaVisualizationService: SchemaVisualizationService) {}

    @Post('parse-schema')
    async parseSchemaString(@Body() parseSchemaDto: ParseSchemaDto): Promise<ERDiagramDto> {
        return await this.schemaVisualizationService.parseSchemaString(parseSchemaDto);
    }

    @Get('database/:id')
    async visualizeDatabase(@Param('id') id: string): Promise<ERDiagramDto> {
        const databaseId = parseInt(id, 10);
        return await this.schemaVisualizationService.visualizeDatabase(databaseId);
    }
}