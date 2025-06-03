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

        try {
            // Get database SQL schema
            const schemaSql = database.schemaSql;
            if (schemaSql) {
                // Extract table names from CREATE TABLE statements
                const tableNames = this.extractTableNames(schemaSql);
                
                // Drop each table if it exists
                for (const tableName of tableNames) {
                    // Check if this is not a Prisma system table
                    if (!tableName.startsWith('_prisma_') && !this.isSystemTable(tableName)) {
                        await this.pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
                    }
                }
            }
        } catch (error) {
            console.error('Error dropping tables:', error);
            // Continue deleting the database record even if dropping tables fails
        }

        // Delete the database record from the Database table
        return this.prisma.database.delete({
            where: { id },
        });
    }

    /**
     * Extracts table names from the SQL schema
     * @param schemaSql SQL database schema
     * @returns array of table names
     */
    private extractTableNames(schemaSql: string): string[] {
        const tableNames: string[] = [];
        const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?([^"'\s(]+)["']?/gi;
        let match;

        while ((match = createTableRegex.exec(schemaSql)) !== null) {
            const tableName = match[1].toLowerCase();
            if (tableName && !tableNames.includes(tableName)) {
                tableNames.push(tableName);
            }
        }

        return tableNames;
    }

    /**
     * Checks if a table is a system table
     * @param tableName table name
     * @returns true if the table is a system table
     */
    private isSystemTable(tableName: string): boolean {
        const systemTables = [
            'user',
            'database',
            'chapter',
            'topic',
            'exercise',
            'answeroption',
            'submission',
            'dbsession',
            'bookmark',
            'progress',
            'chatmessage'
        ];
        return systemTables.includes(tableName.toLowerCase());
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
            const columns = result.fields ? result.fields.map(field => field.name) : [];
            
            // Always return an array for rows, even if empty
            return {
                columns,
                rows: result.rows || []
            };
        } catch (error) {
            // Only throw SqlErrorException for actual SQL errors
            if (error.code) {  // PostgreSQL errors have a code property
                const detail = error.message || error.detail || 'Database error';
                throw new SqlErrorException({
                    message: detail,
                    name: error.name || 'DatabaseError',
                    stack: error.stack
                });
            }
            
            // For successful queries with no results, return empty structure
            return {
                columns: [],
                rows: []
            };
        }
    }
}
