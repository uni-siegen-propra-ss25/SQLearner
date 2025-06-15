import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    UploadedFile,
    ParseIntPipe,
    UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CreateDatabaseDto } from '../models/create-database.dto';
import { UpdateDatabaseDto } from '../models/update-database.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { Roles } from '../../../common/decorators/role.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { DatabasesService } from '../services/databases.service';
import { TablesService } from '../services/tables.service';
import { TableDataService } from '../services/table-data.service';
import { DatabaseImportService } from '../services/database-import.service';
import { RunQueryDto } from '../models/query.dto';
import { CreateTableDto, TableColumnDto, UpdateTableDto } from '../models/table.dto';
import { InsertTableDataDto } from '../models/table-data.dto';
import { FileInterceptor } from '@nestjs/platform-express';

/**
 * Controller managing database operations for the SQL learning system.
 * Handles:
 * - Database management (create, read, update, delete)
 * - Table operations (create, modify tables)
 * - Data operations (insert, update, delete data)
 * - SQL file imports
 * Protected by JWT authentication and role-based access control.
 */
@ApiTags('Databases')
@Controller('databases')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DatabasesController {
    constructor(
        private readonly databasesService: DatabasesService,
        private readonly tablesService: TablesService,
        private readonly tableDataService: TableDataService,
        private readonly databaseImportService: DatabaseImportService,
    ) {}

    @Post('upload')
    @Roles(Role.TUTOR)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload SQL file to create database' })
    @ApiResponse({ status: 201, description: 'SQL file uploaded and database created successfully' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'SQL file to upload',
          },
        },
      },
    })
    async uploadSqlFile(
        @UploadedFile() file: Express.Multer.File,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: string,
    ) {
        return this.databaseImportService.uploadSqlFile(file, userId, userRole);
    }

    @Get()
    @ApiOperation({ summary: 'Get all databases' })
    @ApiResponse({ status: 200, description: 'Return all databases' })
    async getAllDatabases() {
        return this.databasesService.getAllDatabases();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get database by ID' })
    @ApiResponse({ status: 200, description: 'Return database by ID' })
    async getDatabaseById(@Param('id', ParseIntPipe) id: number) {
        return this.databasesService.getDatabaseById(id);
    }

    @Post()
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Create a new empty database' })
    @ApiResponse({ status: 201, description: 'Database created successfully' })
    async createDatabase(
        @Body() dto: CreateDatabaseDto,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: string,
    ) {
        return this.databasesService.createDatabase(dto, userId, userRole);
    }

    @Put(':id')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Update database metadata' })
    @ApiResponse({ status: 200, description: 'Database updated successfully' })
    async updateDatabase(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDatabaseDto,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: string,
    ) {
        return this.databasesService.updateDatabase(id, dto, userId, userRole);
    }

    @Delete(':id')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Delete database' })
    @ApiResponse({ status: 200, description: 'Database and all its tables deleted successfully' })
    async deleteDatabase(
        @Param('id', ParseIntPipe) id: number,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: string,
    ) {
        return this.databasesService.deleteDatabase(id, userId, userRole);
    }

    @Post(':id/query')
    @ApiOperation({ summary: 'Run SQL query on database' })
    @ApiResponse({ status: 200, description: 'Query executed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid query' })
    async runQuery(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RunQueryDto
    ) {
        // This operation stays in DatabasesService since it's a database-level operation
        return this.databasesService.runQuery(id, dto.query);
    }

    // Table Operations

    @Post(':id/tables')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Create a new table in the database' })
    @ApiResponse({ status: 201, description: 'Table created successfully' })
    async createTable(
        @Param('id', ParseIntPipe) databaseId: number,
        @Body() dto: CreateTableDto,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: Role,
    ) {
        return await this.tablesService.createTable(databaseId, dto, userId, userRole);
    }

    @Get(':id/tables')
    @ApiOperation({ summary: 'Get all tables in the database' })
    @ApiResponse({ status: 200, description: 'Tables retrieved successfully' })
    async getTables(@Param('id', ParseIntPipe) databaseId: number) {
        return this.tablesService.getTables(databaseId);
    }

    @Get(':id/tables/:tableId')
    @ApiOperation({ summary: 'Get table details by ID' })
    @ApiResponse({ status: 200, description: 'Table details retrieved successfully' })
    async getTable(
        @Param('id', ParseIntPipe) databaseId: number,
        @Param('tableId', ParseIntPipe) tableId: number,
    ) {
        return this.tablesService.getTable(databaseId, tableId);
    }

    @Put(':id/tables/:tableId')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Update table details' })
    @ApiResponse({ status: 200, description: 'Table updated successfully' })
    async updateTable(
        @Param('id', ParseIntPipe) databaseId: number,
        @Param('tableId', ParseIntPipe) tableId: number,
        @Body() dto: UpdateTableDto,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: Role,
    ) {
        return this.tablesService.updateTable(databaseId, tableId, dto, userId, userRole);
    }

    @Delete(':id/tables/:tableId')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Delete a table' })
    @ApiResponse({ status: 200, description: 'Table deleted successfully' })
    async deleteTable(
        @Param('id', ParseIntPipe) databaseId: number,
        @Param('tableId', ParseIntPipe) tableId: number,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: Role,
    ) {
        return this.tablesService.deleteTable(databaseId, tableId, userId, userRole);
    }

    // Table Data Operations
    
    @Post(':id/tables/:tableId/data')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Insert data into a table' })
    @ApiResponse({ status: 201, description: 'Data inserted successfully' })
    async insertTableData(
        @Param('id', ParseIntPipe) databaseId: number,
        @Param('tableId', ParseIntPipe) tableId: number,
        @Body() dto: InsertTableDataDto,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: Role,
    ) {
        return this.tableDataService.insertTableData(databaseId, tableId, dto, userId, userRole);
    }

    @Get(':id/tables/:tableId/data')
    @ApiOperation({ summary: 'Get data from a table' })
    @ApiResponse({ status: 200, description: 'Table data retrieved successfully' })
    async getTableData(
        @Param('id', ParseIntPipe) databaseId: number,
        @Param('tableId', ParseIntPipe) tableId: number,
    ) {
        return this.tableDataService.getTableData(databaseId, tableId);
    }

    @Delete(':id/tables/:tableId/data')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Delete all data from a table' })
    @ApiResponse({ status: 200, description: 'Data deleted successfully' })
    async truncateTable(
        @Param('id', ParseIntPipe) databaseId: number,
        @Param('tableId', ParseIntPipe) tableId: number,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: Role,
    ) {
        return this.tableDataService.truncateTable(databaseId, tableId, userId, userRole);
    }
}
