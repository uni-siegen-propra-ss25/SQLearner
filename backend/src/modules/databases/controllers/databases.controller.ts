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
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/role/role.guard';
import { Roles } from '../../../common/decorators/role.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Role, User } from '@prisma/client';
import { DatabasesService } from '../services/databases.service';
import { QueryDto } from '../models/query.dto';
import { FileInterceptor } from '@nestjs/platform-express';

/**
 * Controller managing database operations for the SQL learning system.
 * Handles:
 * - File uploads to create databases
 * - Database management (create, read, update, delete) by updating the file
 * Protected by JWT authentication and role-based access control.
 */
@ApiTags('Databases')
@Controller('databases')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DatabasesController {
    constructor(
        private readonly databasesService: DatabasesService,
    ) {}

    @Post('upload')
    @Roles(Role.TUTOR)
    @ApiConsumes('multipart/form-data')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload SQL file to create database' })
    @ApiResponse({ status: 201, description: 'SQL file uploaded and database created successfully' })
    async uploadDatabase(
        @UploadedFile() file: Express.Multer.File,
        @GetUser() user: User,
    ) {
        return this.databasesService.createDatabase(file, user);
    }

    @Get()
    @Roles(Role.TUTOR)
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
        @Body() file: Express.Multer.File,
        @GetUser() user: User,
    ) {
        return this.databasesService.createDatabase(file, user);
    }

    @Put(':id')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Update database metadata' })
    @ApiResponse({ status: 200, description: 'Database updated successfully' })
    async updateDatabase(
        @Param('id', ParseIntPipe) databaseId: number,
        @GetUser() user: User,
        @Body() file: Express.Multer.File,
    ) {
        return this.databasesService.updateDatabase(databaseId, user, file);
    }

    @Delete(':id')
    @Roles(Role.TUTOR)
    @ApiOperation({ summary: 'Delete database' })
    @ApiResponse({ status: 200, description: 'Database and all its tables deleted successfully' })
    async deleteDatabase(
        @Param('id', ParseIntPipe) id: number, // Database ID
        @GetUser() user: User,
    ) {
        return this.databasesService.deleteDatabase(id, user);
    }

    @Post(':id/query')
    @ApiOperation({ summary: 'Run SQL query on database' })
    @ApiResponse({ status: 200, description: 'Query executed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid query' })
    async runQuery(
        @Param('id', ParseIntPipe) id: number, // Session ID for the database
        @Body() dto: QueryDto
    ) {
        // This operation stays in DatabasesService since it's a database-level operation
        return this.databasesService.runQuery(id, dto.query);
    }
}