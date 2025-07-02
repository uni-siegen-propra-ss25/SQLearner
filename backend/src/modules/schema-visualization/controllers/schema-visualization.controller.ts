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
        console.log('🚀 [AUDIT] API Request - parse-schema:');
        console.log('   Schema Length:', parseSchemaDto.schema?.length || 0);
        console.log('   Schema Name:', parseSchemaDto.name || 'None');
        
        const result = await this.schemaVisualizationService.parseSchemaString(parseSchemaDto);
        
        console.log('📤 [AUDIT] API Response - parse-schema:');
        console.log('   Tables Count:', result.tables?.length || 0);
        console.log('   Relationships Count:', result.relationships?.length || 0);
        console.log('   DBML Code Length:', result.dbmlCode?.length || 0);
        console.log('   Tables:', result.tables?.map(t => ({ name: t.name, columns: t.columns?.length || 0 })));
        console.log('   Relationships:', result.relationships?.map(r => `${r.fromTable}.${r.fromColumn} -> ${r.toTable}.${r.toColumn}`));
        
        return result;
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

    /**
     * Test endpoint for FK parsing with minimal example.
     * @returns {Promise<ERDiagramDto>} - The ER diagram data transfer object.
     */
    @Get('test-fk-parsing')
    async testFkParsing(): Promise<ERDiagramDto> {
        console.log('🧪 Testing FK parsing with minimal example');
        
        const testSchema = `
CREATE TABLE parent (
    id INTEGER PRIMARY KEY
);

CREATE TABLE child (
    id INTEGER,
    parent_id INTEGER,
    FOREIGN KEY (parent_id) REFERENCES parent(id)
);`;

        const parseSchemaDto: ParseSchemaDto = {
            schema: testSchema,
            name: 'test-fk-schema'
        };

        return this.schemaVisualizationService.parseSchemaString(parseSchemaDto);
    }
}