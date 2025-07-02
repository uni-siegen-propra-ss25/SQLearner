import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SchemaVisualizationService } from '../services/schema-visualization.service';
import { ERDiagramDto, ParseSchemaDto } from '../models/er-diagram.dto';

/**
 * Controller for schema visualization endpoints.
 * Provides API routes for parsing SQL schemas and visualizing database schemas as ER diagrams.
 */
@Controller('schema-visualization')
export class SchemaVisualizationController {
    /**
     * Creates an instance of SchemaVisualizationController.
     * @param {SchemaVisualizationService} schemaVisualizationService - The service for schema visualization logic.
     */
    constructor(private readonly schemaVisualizationService: SchemaVisualizationService) {}

    /**
     * Parses a SQL schema string and returns an ER diagram DTO.
     * @param {ParseSchemaDto} parseSchemaDto - DTO containing the schema string and optional name.
     * @returns {Promise<ERDiagramDto>} - The ER diagram data transfer object.
     */
    @Post('parse-schema')
    async parseSchemaString(@Body() parseSchemaDto: ParseSchemaDto): Promise<ERDiagramDto> {
        return await this.schemaVisualizationService.parseSchemaString(parseSchemaDto);
    }

    /**
     * Visualizes a database schema by its database ID.
     * @param {string} id - The ID of the database as a string.
     * @returns {Promise<ERDiagramDto>} - The ER diagram data transfer object.
     */
    @Get('database/:id')
    async visualizeDatabase(@Param('id') id: string): Promise<ERDiagramDto> {
        const databaseId = parseInt(id, 10);
        return await this.schemaVisualizationService.visualizeDatabase(databaseId);
    }
}