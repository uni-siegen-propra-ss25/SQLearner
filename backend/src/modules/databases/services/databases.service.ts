import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDatabaseDto } from '../models/create-database.dto';
import { UpdateDatabaseDto } from '../models/update-database.dto';
import { Role } from '@prisma/client';
import { Pool } from 'pg';
import { SqlErrorException } from '../../../common/exceptions/sql-error.exception';

@Injectable()
export class DatabasesService {
    private pool: Pool;

    constructor(private prisma: PrismaService) {
        // Initialise connection pool with PostgreSQL
        this.pool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
    }

    async createDatabase(dto: CreateDatabaseDto, userId: number, userRole: Role | string) {
        if (String(userRole).toUpperCase() !== 'TUTOR') {
            throw new ForbiddenException('Only tutors can create databases');
        }

        // Create a record in the Database table
        const database = await this.prisma.database.create({
            data: {
                name: dto.name,
                description: dto.description,
                schemaSql: dto.schemaSql,
                ownerId: userId,
            },
        });

        try {
            // Execute SQL schema
            if (dto.schemaSql) {
                await this.pool.query(dto.schemaSql);
                console.log('SQL schema executed successfully');
            }
        } catch (error) {
            console.error('Error executing SQL schema:', error);
            // You can add additional error handling here
        }

        return database;
    }

    async getAllDatabases() {
        return this.prisma.database.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async getDatabaseById(id: number) {
        const database = await this.prisma.database.findUnique({
            where: { id },
        });

        if (!database) {
            throw new NotFoundException(`Database with ID ${id} not found`);
        }

        return database;
    }

    async updateDatabase(
        id: number,
        dto: UpdateDatabaseDto,
        userId: number,
        userRole: Role | string,
    ) {
        const database = await this.getDatabaseById(id);

        if (String(userRole).toUpperCase() !== 'TUTOR' || database.ownerId !== userId) {
            throw new ForbiddenException('Only the creator tutor can update this database');
        }

        return this.prisma.database.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
                schemaSql: dto.schemaSql,
            },
        });
    }

    async deleteDatabase(id: number, userId: number, userRole: Role | string) {
        const database = await this.getDatabaseById(id);

        if (String(userRole).toUpperCase() !== 'TUTOR' || database.ownerId !== userId) {
            throw new ForbiddenException('Only the creator tutor can delete this database');
        }

        return this.prisma.database.delete({
            where: { id },
        });
    }

    async uploadSqlFile(file: Express.Multer.File, userId: number, userRole: Role | string) {
        if (String(userRole).toUpperCase() !== 'TUTOR') {
            throw new ForbiddenException('Only tutors can upload SQL files');
        }

        const schema = file.buffer.toString();

        const database = await this.prisma.database.create({
            data: {
                name: file.originalname,
                description: 'Uploaded SQL file',
                schemaSql: schema,
                ownerId: userId,
            },
        });

        try {
            // Execute SQL schema from file
            if (schema) {
                await this.pool.query(schema);
                console.log('SQL schema from file executed successfully');
            }
        } catch (error) {
            console.error('Error executing SQL schema from file:', error);
        }

        return database;
    }

    /**
     * Runs a SQL query on a database.
     *
     * @param id - The ID of the database to run the query on
     * @param query - The query to run
     * @returns Promise resolving to the query result
     * @throws NotFoundException if the database does not exist
     */
    async runQuery(id: number, query: string): Promise<{ columns: string[]; rows: any[]; error?: string }> {
        const database = await this.getDatabaseById(id);

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        try {
            const result = await this.pool.query(query);
            
            // Extract column names from fields
            const columns = result.fields.map(field => field.name);
            
            // Return formatted result with empty rows if no results
            return {
                columns: columns || [],
                rows: result.rows || []
            };
        } catch (error) {
            // PostgreSQL error object has detailed information
            const detail = error.message || error.detail || 'Unknown database error';
            throw new SqlErrorException({
                message: detail,
                name: error.name || 'DatabaseError',
                stack: error.stack
            });
        }
    }
}
