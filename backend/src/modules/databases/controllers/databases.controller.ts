import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DatabasesService } from '../services/databases.service';
import { CreateDatabaseDto } from '../models/create-database.dto';
import { UpdateDatabaseDto } from '../models/update-database.dto';
import { Role, Database } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/role/role.guard';
import { Roles } from 'src/common/decorators/role.decorator';

@ApiTags('Databases')
@Controller('databases')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DatabasesController {
    constructor(private readonly databasesService: DatabasesService) {}

    @Get()
    @ApiOperation({ summary: 'Get all databases accessible to the user' })
    @ApiResponse({ status: 200, description: 'List of databases' })
    async getDatabases(@Request() req): Promise<Database[]> {
        return this.databasesService.getDatabases(req.user.id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a database by ID' })
    @ApiResponse({ status: 200, description: 'The database' })
    @ApiResponse({ status: 404, description: 'Database not found' })
    async getDatabaseById(@Param('id') id: number, @Request() req): Promise<Database> {
        return this.databasesService.getDatabaseById(id, req.user.id);
    }

    @Post()
    @Roles(Role.TUTOR, Role.ADMIN)
    @ApiOperation({ summary: 'Create a new database' })
    @ApiResponse({ status: 201, description: 'The database has been created' })
    async createDatabase(
        @Body() createDatabaseDto: CreateDatabaseDto,
        @Request() req,
    ): Promise<Database> {
        return this.databasesService.createDatabase(createDatabaseDto, req.user.id);
    }

    @Put(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @ApiOperation({ summary: 'Update a database' })
    @ApiResponse({ status: 200, description: 'The database has been updated' })
    @ApiResponse({ status: 404, description: 'Database not found' })
    async updateDatabase(
        @Param('id') id: number,
        @Body() updateDatabaseDto: UpdateDatabaseDto,
        @Request() req,
    ): Promise<Database> {
        return this.databasesService.updateDatabase(id, updateDatabaseDto, req.user.id);
    }

    @Delete(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @ApiOperation({ summary: 'Delete a database' })
    @ApiResponse({ status: 200, description: 'The database has been deleted' })
    @ApiResponse({ status: 404, description: 'Database not found' })
    async deleteDatabase(@Param('id') id: number, @Request() req): Promise<void> {
        return this.databasesService.deleteDatabase(id, req.user.id);
    }
}
