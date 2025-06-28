import { Injectable, ForbiddenException, NotFoundException, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Role, User, ContainerStatus, Database } from '@prisma/client';
import { SqlErrorException } from '../../../common/exceptions/sql-error.exception';
import { DockerService } from '../../docker/services/docker.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Pool, Client } from 'pg';
import { DatabaseDto } from '../models/database.dto';
import { CreateDatabaseDto } from '../models/create-database.dto';
import { UpdateDatabaseDto } from '../models/update-database.dto';
import { QueryResult } from '../../sql-evaluation/models/query-result.dto';

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
        return this.prisma.database.findMany();
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
        const database = await this.getDatabaseById(id);

        if (user.role !== Role.ADMIN) {
            throw new ForbiddenException('You do not have permission to update this database.');
        }

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

        if (user.role !== Role.ADMIN) {
            throw new ForbiddenException('You do not have permission to delete this database.');
        }

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
                await adminPool.query(`DROP DATABASE "${dbName}"`);
                console.log(`Database ${dbName} dropped successfully`);
                await adminPool.end();
            }
        } catch (error) {
            console.error(`Error dropping database ${database.schemaSql}:`, error);
        }

        // Delete the database record
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

    async runQueryInContainer(connectionDetails: any, query: string): Promise<QueryResult> {
        let client: Client | null = null;
        const startTime = Date.now();
        try {
            client = new Client(connectionDetails);
            await client.connect();
            const result = await client.query(query);
            const executionTimeMs = Date.now() - startTime;
            return {
                columns: result.fields.map(field => field.name),
                rows: result.rows,
                rowCount: result.rowCount ?? 0,
                command: result.command,
                executionTimeMs,
            };
        } catch (e) {
            const executionTimeMs = Date.now() - startTime;
            const error = e as Error;
            return {
                columns: [],
                rows: [],
                rowCount: 0,
                executionTimeMs,
                error: error.message,
            };
        }
        finally {
            if (client) {
                await client.end();
            }
        }
    }

    async createTable(databaseId: number, dto: any, userId: number, userRole: Role | string) {
        if (String(userRole).toUpperCase() !== 'TUTOR') {
            throw new ForbiddenException('Only tutors can create tables');
        }
        // Getting the database
        const database = await this.getDatabaseById(databaseId);
        if (!database) {
            throw new NotFoundException('Database not found');
        }
        
        // Generate SQL for table creation
        const columnsSql = dto.columns.map((col: any) => {
            let colDef = `"${col.name}" ${col.type}`;
            if (col.isPrimaryKey) colDef += ' PRIMARY KEY';
            if (col.autoIncrement) colDef += ' GENERATED ALWAYS AS IDENTITY';
            if (col.nullable === false) colDef += ' NOT NULL';
            if (col.defaultValue) colDef += ` DEFAULT ${col.defaultValue}`;
            return colDef;
        }).join(', ');
        const createTableSql = `CREATE TABLE "${dto.name}" (${columnsSql})`;
        // Execute SQL in the required database
        const dbPool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: database.schemaSql
        });
        await dbPool.query(createTableSql);
        await dbPool.end();
        return { message: 'Table created successfully' };
    }

    /**
     * Inserts a new row into a table
     * @param databaseId - The ID of the database
     * @param tableName - The name of the table
     * @param data - The data to insert
     * @param userRole - The role of the user
     * @returns Promise resolving to the inserted row
     */
    async insertRow(databaseId: number, tableName: string, data: Record<string, any>, userRole: Role | string) {
        if (String(userRole).toUpperCase() !== 'TUTOR') {
            throw new ForbiddenException('Only tutors can insert data');
        }

        const database = await this.getDatabaseById(databaseId);
        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Validate table exists
        const tableExists = await this.tableExists(database.schemaSql, tableName);
        if (!tableExists) {
            throw new NotFoundException(`Table ${tableName} not found`);
        }

        // Build INSERT query
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        
        const insertSql = `INSERT INTO "${tableName}" (${columns.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`;

        const dbPool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: database.schemaSql
        });

        try {
            const result = await dbPool.query(insertSql, values);
            return result.rows[0];
        } catch (error) {
            throw new SqlErrorException({
                message: `Failed to insert row: ${error instanceof Error ? error.message : 'Unknown error'}`,
                name: 'InsertError',
                code: 'INSERT_ERROR'
            });
        } finally {
            await dbPool.end();
        }
    }

    /**
     * Updates a row in a table
     * @param databaseId - The ID of the database
     * @param tableName - The name of the table
     * @param data - The data to update
     * @param whereClause - The WHERE clause for the update
     * @param userRole - The role of the user
     * @returns Promise resolving to the updated row
     */
    async updateRow(databaseId: number, tableName: string, data: Record<string, any>, whereClause: string, userRole: Role | string) {
        if (String(userRole).toUpperCase() !== 'TUTOR') {
            throw new ForbiddenException('Only tutors can update data');
        }

        const database = await this.getDatabaseById(databaseId);
        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Validate table exists
        const tableExists = await this.tableExists(database.schemaSql, tableName);
        if (!tableExists) {
            throw new NotFoundException(`Table ${tableName} not found`);
        }

        // Build UPDATE query
        const columns = Object.keys(data);
        const values = Object.values(data);
        const setClause = columns.map((col, index) => `"${col}" = $${index + 1}`).join(', ');
        
        const updateSql = `UPDATE "${tableName}" SET ${setClause} WHERE ${whereClause} RETURNING *`;

        const dbPool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: database.schemaSql
        });

        try {
            const result = await dbPool.query(updateSql, values);
            if (result.rowCount === 0) {
                throw new NotFoundException('No rows were updated');
            }
            return result.rows[0];
        } catch (error) {
            throw new SqlErrorException({
                message: `Failed to update row: ${error instanceof Error ? error.message : 'Unknown error'}`,
                name: 'UpdateError',
                code: 'UPDATE_ERROR'
            });
        } finally {
            await dbPool.end();
        }
    }

    /**
     * Deletes a row from a table
     * @param databaseId - The ID of the database
     * @param tableName - The name of the table
     * @param whereClause - The WHERE clause for the delete
     * @param userRole - The role of the user
     * @returns Promise resolving to the deletion result
     */
    async deleteRow(databaseId: number, tableName: string, whereClause: string, userRole: Role | string) {
        if (String(userRole).toUpperCase() !== 'TUTOR') {
            throw new ForbiddenException('Only tutors can delete data');
        }

        const database = await this.getDatabaseById(databaseId);
        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Validate table exists
        const tableExists = await this.tableExists(database.schemaSql, tableName);
        if (!tableExists) {
            throw new NotFoundException(`Table ${tableName} not found`);
        }

        const deleteSql = `DELETE FROM "${tableName}" WHERE ${whereClause} RETURNING *`;

        const dbPool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: database.schemaSql
        });

        try {
            const result = await dbPool.query(deleteSql);
            if (result.rowCount === 0) {
                throw new NotFoundException('No rows were deleted');
            }
            return { message: 'Row deleted successfully', deletedRow: result.rows[0] };
        } catch (error) {
            throw new SqlErrorException({
                message: `Failed to delete row: ${error instanceof Error ? error.message : 'Unknown error'}`,
                name: 'DeleteError',
                code: 'DELETE_ERROR'
            });
        } finally {
            await dbPool.end();
        }
    }

    /**
     * Checks if a table exists in the database
     * @param dbName - The database name
     * @param tableName - The table name
     * @returns Promise resolving to boolean
     */
    private async tableExists(dbName: string, tableName: string): Promise<boolean> {
        const dbPool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName
        });

        try {
            const result = await dbPool.query(
                `SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = $1
                )`,
                [tableName]
            );
            return result.rows[0].exists;
        } finally {
            await dbPool.end();
        }
    }
}
