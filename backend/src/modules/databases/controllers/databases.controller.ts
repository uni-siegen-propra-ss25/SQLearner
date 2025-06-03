import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DatabasesService } from '../services/databases.service';
import { Database } from '../models/database.model';
import { CreateDatabaseDto } from '../models/create-database.dto';
import { UpdateDatabaseDto } from '../models/update-database.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { Roles } from '../../../common/decorators/role.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Role } from '@prisma/client';

interface RunQueryDto {
    query: string;
}

/**
 * Controller managing database operations for the SQL learning system.
 * Handles creation, modification, and deletion of practice databases.
 * Includes functionality for uploading SQL files and managing database access.
 * Protected by JWT authentication and role-based access control.
 *
 * @class DatabasesController
 */
@ApiTags('Databases')
@Controller('databases')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DatabasesController {
    constructor(private readonly databasesService: DatabasesService) {}

    @Post()
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Create a new database' })
    @ApiResponse({ status: 201, description: 'Database created successfully' })
    async createDatabase(
        @Body() dto: CreateDatabaseDto,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: string,
    ) {
        return this.databasesService.createDatabase(dto, userId, userRole);
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

    @Put(':id')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Update database' })
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
    @ApiResponse({ status: 200, description: 'Database deleted successfully' })
    async deleteDatabase(
        @Param('id', ParseIntPipe) id: number,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: string,
    ) {
        return this.databasesService.deleteDatabase(id, userId, userRole);
    }

    @Post('upload')
    @Roles(Role.TUTOR)
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload SQL file' })
    @ApiResponse({ status: 201, description: 'SQL file uploaded successfully' })
    async uploadSqlFile(
        @UploadedFile() file: Express.Multer.File,
        @GetUser('id') userId: number,
        @GetUser('role') userRole: string,
    ) {
        return this.databasesService.uploadSqlFile(file, userId, userRole);
    }

    @Post(':id/query')
    @ApiOperation({ summary: 'Run SQL query on database' })
    @ApiResponse({ status: 200, description: 'Query executed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid query' })
    @ApiResponse({ status: 403, description: 'Operation not allowed' })
    @ApiResponse({ status: 404, description: 'Database not found' })
    async runQuery(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: RunQueryDto,
    ) {
        return this.databasesService.runQuery(id, dto.query);
    }
}
