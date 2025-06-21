import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Role, User, ContainerStatus, Database } from '@prisma/client';
import { SqlErrorException } from '../../../common/exceptions/sql-error.exception';
import { DockerService } from '../../docker/services/docker.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Pool } from 'pg';
import { DatabaseDto } from '../models/database.dto';
import { CreateDatabaseDto } from '../models/create-database.dto';
import { UpdateDatabaseDto } from '../models/update-database.dto';

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

    async getAllDatabases() {
        
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

    async uploadDatabase(file: Express.Multer.File, user: User) {
        if (user.role !== Role.TUTOR) {
            throw new ForbiddenException('Only tutors can upload SQL files');
        }

        const schema = file.buffer.toString();

        // Create a record in the Database table
        const database = await this.prisma.database.create({
            data: {
                name: file.originalname,
                description: 'Uploaded SQL file',
                schemaSql: schema
            },
        });

        try {
            // Create a new PostgreSQL database
            const dbName = `db_${database.id}_${file.originalname.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            
            // Connect to default database to create new database
            const adminPool = new Pool({
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '5432', 10),
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            });

            // Create the new database
            await adminPool.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database ${dbName} created successfully`);

            // Close admin connection
            await adminPool.end();

            // Update the database record with the actual database name
            await this.prisma.database.update({
                where: { id: database.id },
                data: { 
                    schemaSql: dbName // Store the actual database name instead of SQL schema
                }
            });

            // Execute SQL schema from file in the new database
            if (schema && schema.trim()) {
                const newDbPool = new Pool({
                    host: process.env.DB_HOST,
                    port: parseInt(process.env.DB_PORT || '5432', 10),
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: dbName
                });

                await newDbPool.query(schema);
                console.log('SQL schema from file executed successfully in new database');
                await newDbPool.end();
            }

        } catch (error) {
            console.error('Error creating database from file:', error);
            // Delete the database record if creation fails
            await this.prisma.database.delete({
                where: { id: database.id },
            });
            throw error;
        }

        return database;
    }

    async createDatabase(dto: CreateDatabaseDto, user: User) {
        
        if (user.role !== Role.TUTOR) {
            throw new ForbiddenException('Only tutors can create databases');
        }

        // Create a record in the Database table
        const database = await this.prisma.database.create({
            data: {
                name: dto.name,
                description: dto.description,
                schemaSql: dto.schemaSql || ''
            },
        });

        try {
            // Create a new PostgreSQL database
            const dbName = `db_${database.id}_${dto.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            
            // Connect to default database to create new database
            const adminPool = new Pool({
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '5432', 10),
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME
            });

            // Create the new database
            await adminPool.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database ${dbName} created successfully`);

            // Close admin connection
            await adminPool.end();

            // Update the database record with the actual database name
            await this.prisma.database.update({
                where: { id: database.id },
                data: { 
                    schemaSql: dbName // Store the actual database name instead of SQL schema
                }
            });

            // If there's initial schema SQL, execute it in the new database
            if (dto.schemaSql && dto.schemaSql.trim()) {
                const newDbPool = new Pool({
                    host: process.env.DB_HOST,
                    port: parseInt(process.env.DB_PORT || '5432', 10),
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: dbName
                });

                await newDbPool.query(dto.schemaSql);
                console.log('Initial SQL schema executed successfully in new database');
                await newDbPool.end();
            }

        } catch (error) {
            console.error('Error creating database:', error);
            // Delete the database record if creation fails
            await this.prisma.database.delete({
                where: { id: database.id },
            });
            
            // Re-throw the error with proper formatting
            if (error instanceof Error && 'code' in error) {
                const pgError = error as PostgresError;
                const errorMap: { [key: string]: string } = {
                    '42P01': 'Table does not exist',
                    '42703': 'Column does not exist',
                    '23505': 'Unique constraint violation',
                    '23503': 'Foreign key violation',
                    '42601': 'Syntax error in SQL schema',
                    '28P01': 'Invalid password',
                    '3D000': 'Database does not exist',
                    '42501': 'Permission denied',
                    '42P04': 'Database already exists'
                };

                const errorMessage = errorMap[pgError.code] || pgError.message;
                throw new SqlErrorException({
                    message: `Failed to create database: ${errorMessage}`,
                    name: pgError.name,
                    code: pgError.code,
                    detail: pgError.detail,
                    stack: pgError.stack
                });
            }
            
            throw new SqlErrorException({
                message: `Failed to create database: ${error instanceof Error ? error.message : 'Unknown error'}`,
                name: 'DatabaseCreationError',
                code: 'DB_CREATE_ERROR'
            });
        }

        return database;
    }

    async updateDatabase(
        id: number,
        dto: UpdateDatabaseDto,
        user: User,
    ) {
        if (user.role !== Role.TUTOR) {
            throw new ForbiddenException('Only tutors can update databases');
        }
        
        const database = await this.getDatabaseById(id);

        // Only update name and description, not schemaSql (which contains the database name)
        const updateData: any = {};
        if (dto.name !== undefined) updateData.name = dto.name;
        if (dto.description !== undefined) updateData.description = dto.description;

        return this.prisma.database.update({
            where: { id },
            data: updateData,
        });
    }

    async deleteDatabase(id: number, user: User) {
        const database = await this.getDatabaseById(id);

        try {
            // Get database name from schemaSql field
            const dbName = database.schemaSql;
            if (dbName) {
                // Connect to default database to drop the target database
                const adminPool = new Pool({
                    host: process.env.DB_HOST,
                    port: parseInt(process.env.DB_PORT || '5432', 10),
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME
                });

                // Terminate all connections to the database first
                await adminPool.query(`
                    SELECT pg_terminate_backend(pid) 
                    FROM pg_stat_activity 
                    WHERE datname = $1 AND pid <> pg_backend_pid()
                `, [dbName]);

                // Drop the database
                await adminPool.query(`DROP DATABASE IF EXISTS "${dbName}"`);
                console.log(`Database ${dbName} dropped successfully`);
                await adminPool.end();
            }
        } catch (error) {
            console.error('Error dropping database:', error);
            // Continue deleting the database record even if dropping database fails
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

    /**
     * Runs a SQL query on a database.
     *
     * @param id - The ID of the database to run the query on
     * @param query - The query to run
     * @returns Promise resolving to the query result
     * @throws NotFoundException if the database does not exist
     * @throws SqlErrorException for SQL errors
     * @throws ForbiddenException for attempts to modify system tables
     */
    async runQuery(id: number, query: string): Promise<{ 
        columns: string[]; 
        rows: any[]; 
        rowCount?: number;
        command?: string;
        error?: string;
    }> {
        const database = await this.getDatabaseById(id);

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Get the actual database name from schemaSql field
        const dbName = database.schemaSql;
        if (!dbName) {
            throw new NotFoundException('Database not properly initialized');
        }

        // Check if query tries to modify system tables
        const affectedTables = this.extractAffectedTables(query);
        const systemTables = affectedTables.filter(table => this.isSystemTable(table));
        
        if (systemTables.length > 0) {
            throw new ForbiddenException(
                `Operation not allowed on system tables: ${systemTables.join(', ')}`
            );
        }

        // Create a new connection pool for the specific database
        const dbPool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName
        });

        const client = await dbPool.connect();
        try {
            // Start transaction for write operations
            const isWriteOperation = this.isWriteOperation(query);
            if (isWriteOperation) {
                await client.query('BEGIN');
            }

            const result = await client.query(query);
            
            if (isWriteOperation) {
                await client.query('COMMIT');
            }

            // Extract column names from fields
            const columns = result.fields ? result.fields.map(field => field.name) : [];
            
            return {
                columns,
                rows: result.rows || [],
                rowCount: result.rowCount || undefined,
                command: result.command
            };
        } catch (error) {
            if (this.isWriteOperation(query)) {
                await client.query('ROLLBACK');
            }

            // Handle specific PostgreSQL errors
            if (error instanceof Error && 'code' in error) {
                const pgError = error as PostgresError;
                const errorMap: { [key: string]: string } = {
                    '42P01': 'Table does not exist',
                    '42703': 'Column does not exist',
                    '23505': 'Unique constraint violation',
                    '23503': 'Foreign key violation',
                    '42601': 'Syntax error',
                    '28P01': 'Invalid password',
                    '3D000': 'Database does not exist',
                    '42501': 'Permission denied'
                };

                const errorMessage = errorMap[pgError.code] || pgError.message;
                throw new SqlErrorException({
                    message: errorMessage,
                    name: pgError.name,
                    code: pgError.code,
                    detail: pgError.detail,
                    stack: pgError.stack
                });
            }
            
            throw error;
        } finally {
            client.release();
            await dbPool.end();
        }
    }

    /**
     * Extracts table names that would be affected by a SQL query
     * @param query SQL query
     * @returns array of affected table names
     */
    private extractAffectedTables(query: string): string[] {
        const tables = new Set<string>();
        const patterns = [
            /FROM\s+["']?([^"'\s,;()]+)["']?/gi,  // SELECT FROM
            /JOIN\s+["']?([^"'\s,;()]+)["']?/gi,  // JOIN
            /UPDATE\s+["']?([^"'\s,;()]+)["']?/gi, // UPDATE
            /INTO\s+["']?([^"'\s,;()]+)["']?/gi,  // INSERT INTO
            /TABLE\s+["']?([^"'\s,;()]+)["']?/gi  // CREATE/DROP TABLE
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(query)) !== null) {
                const tableName = match[1].toLowerCase();
                if (tableName && !tableName.startsWith('_prisma_')) {
                    tables.add(tableName);
                }
            }
        }

        return Array.from(tables);
    }

    /**
     * Checks if a query is a write operation (INSERT, UPDATE, DELETE, etc.)
     * @param query SQL query
     * @returns true if the query modifies data
     */
    private isWriteOperation(query: string): boolean {
        const writeCommands = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE'];
        const normalizedQuery = query.trim().toUpperCase();
        return writeCommands.some(cmd => normalizedQuery.startsWith(cmd));
    }
}
