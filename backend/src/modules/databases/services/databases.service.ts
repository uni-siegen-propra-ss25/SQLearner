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

/**
 * Service for managing database operations, schema extraction, and SQL execution.
 * Handles creation, update, deletion, and querying of user databases.
 */
@Injectable()
export class DatabasesService {
    private pool: Pool;

    /**
     * Initializes the DatabasesService with a PostgreSQL connection pool.
     * @param {PrismaService} prisma - The Prisma service for database access.
     */
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

    /**
     * Retrieves all databases from the system.
     * @returns {Promise<Database[]>} - Array of all database records.
     */
    async getAllDatabases() {
        return this.prisma.database.findMany();
    }

    /**
     * Retrieves a database by its ID.
     * @param {number} id - The ID of the database.
     * @returns {Promise<Database>} - The database record.
     * @throws {NotFoundException} - If the database does not exist.
     */
    async getDatabaseById(id: number) {
        const database = await this.prisma.database.findUnique({
            where: { id },
        });

        if (!database) {
            throw new NotFoundException(`Database with ID ${id} not found`);
        }

        return database;
    }

    /**
     * Gets the actual PostgreSQL schema from the real database
     * Removes PostgreSQL-specific syntax like ::regclass, ::type casts to ensure
     * compatibility with parsers and clean display in frontend
     * @param {number} id - Database ID
     * @returns {Promise<{ schema: string }>} - SQL schema as string without PostgreSQL casts
     * @throws {NotFoundException|InternalServerErrorException} - If the database is not found or retrieval fails
     */
    async getDatabaseSchema(id: number): Promise<{ schema: string }> {
        const database = await this.getDatabaseById(id);
        
        // Get the actual database name from schemaSql field
        const dbName = database.schemaSql;
        if (!dbName) {
            throw new NotFoundException('Database not properly initialized');
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
            // Query to get all table definitions
            const tableQuery = `
                SELECT 
                    table_name
                FROM 
                    information_schema.tables 
                WHERE 
                    table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                ORDER BY 
                    table_name;
            `;
            
            const tablesResult = await client.query(tableQuery);
            const tableNames = tablesResult.rows.map(row => row.table_name);
            
            let schemaSQL = '';
            
            // For each table, get its CREATE TABLE statement
            for (const tableName of tableNames) {
                // Get table structure
                const columnsQuery = `
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        character_maximum_length,
                        numeric_precision,
                        numeric_scale
                    FROM 
                        information_schema.columns 
                    WHERE 
                        table_schema = 'public' 
                        AND table_name = $1
                    ORDER BY 
                        ordinal_position;
                `;
                
                const columnsResult = await client.query(columnsQuery, [tableName]);
                
                // Get primary keys
                const pkQuery = `
                    SELECT 
                        column_name
                    FROM 
                        information_schema.key_column_usage kcu
                    JOIN 
                        information_schema.table_constraints tc 
                        ON kcu.constraint_name = tc.constraint_name
                    WHERE 
                        tc.table_schema = 'public' 
                        AND tc.table_name = $1 
                        AND tc.constraint_type = 'PRIMARY KEY'
                    ORDER BY 
                        kcu.ordinal_position;
                `;
                
                const pkResult = await client.query(pkQuery, [tableName]);
                const primaryKeys = pkResult.rows.map(row => row.column_name);
                
                // Get foreign keys
                const fkQuery = `
                    SELECT 
                        kcu.column_name,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name
                    FROM 
                        information_schema.key_column_usage AS kcu
                    JOIN 
                        information_schema.referential_constraints AS rc
                        ON kcu.constraint_name = rc.constraint_name
                    JOIN 
                        information_schema.key_column_usage AS ccu
                        ON ccu.constraint_name = rc.unique_constraint_name
                    WHERE 
                        kcu.table_schema = 'public' 
                        AND kcu.table_name = $1;
                `;
                
                const fkResult = await client.query(fkQuery, [tableName]);
                
                // Build CREATE TABLE statement
                schemaSQL += `CREATE TABLE ${tableName} (\n`;
                
                const columnDefinitions = columnsResult.rows.map(column => {
                    let def = `    ${column.column_name} `;
                    
                    // Handle data type
                    if (column.data_type === 'character varying' && column.character_maximum_length) {
                        def += `VARCHAR(${column.character_maximum_length})`;
                    } else if (column.data_type === 'character' && column.character_maximum_length) {
                        def += `CHAR(${column.character_maximum_length})`;
                    } else if (column.data_type === 'numeric' && column.numeric_precision) {
                        if (column.numeric_scale) {
                            def += `NUMERIC(${column.numeric_precision}, ${column.numeric_scale})`;
                        } else {
                            def += `NUMERIC(${column.numeric_precision})`;
                        }
                    } else {
                        def += column.data_type.toUpperCase();
                    }
                    
                    // Handle NOT NULL
                    if (column.is_nullable === 'NO') {
                        def += ' NOT NULL';
                    }
                    
                    // Handle DEFAULT
                    if (column.column_default) {
                        def += ` DEFAULT ${column.column_default}`;
                    }
                    
                    return def;
                });
                
                schemaSQL += columnDefinitions.join(',\n');
                
                // Add PRIMARY KEY constraint
                if (primaryKeys.length > 0) {
                    schemaSQL += `,\n    PRIMARY KEY (${primaryKeys.join(', ')})`;
                }
                
                // Add FOREIGN KEY constraints
                for (const fk of fkResult.rows) {
                    schemaSQL += `,\n    FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name})`;
                }
                
                schemaSQL += '\n);\n\n';
            }
            
            // Clean up PostgreSQL-specific syntax before returning
            schemaSQL = this.sanitizePostgreSQLSchema(schemaSQL);
            
            return { schema: schemaSQL.trim() };
            
        } catch (error) {
            console.error('Error retrieving database schema:', error);
            throw new InternalServerErrorException('Failed to retrieve database schema');
        } finally {
            client.release();
            await dbPool.end();
        }
    }

    /**
     * Uploads a SQL file and creates a new database from it.
     * @param {Express.Multer.File} file - The uploaded SQL file.
     * @param {User} user - The user performing the upload.
     * @returns {Promise<Database>} - The created database record.
     * @throws {ForbiddenException} - If the user is not a tutor.
     */
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

    /**
     * Creates a new database with the given parameters.
     * @param {CreateDatabaseDto} dto - DTO containing database creation data.
     * @param {User} user - The user creating the database.
     * @returns {Promise<Database>} - The created database record.
     * @throws {ForbiddenException|SqlErrorException} - If the user is not a tutor or creation fails.
     */
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

    /**
     * Updates a database's name and description.
     * @param {number} id - The ID of the database to update.
     * @param {UpdateDatabaseDto} dto - DTO with update data.
     * @param {User} user - The user performing the update.
     * @returns {Promise<Database>} - The updated database record.
     * @throws {ForbiddenException} - If the user is not a tutor.
     */
    async updateDatabase(
        id: number,
        dto: UpdateDatabaseDto,
        user: User,
    ) {
        const database = await this.getDatabaseById(id);

        if (user.role !== Role.TUTOR) {
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

    /**
     * Deletes a database and drops the corresponding PostgreSQL database.
     * @param {number} id - The ID of the database to delete.
     * @param {User} user - The user performing the deletion.
     * @returns {Promise<Database>} - The deleted database record.
     * @throws {ForbiddenException} - If the user is not a tutor.
     */
    async deleteDatabase(id: number, user: User) {
        const database = await this.getDatabaseById(id);

        if (user.role !== Role.TUTOR) {
            throw new ForbiddenException('You are not the owner of this database.');
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
     * @param {string} schemaSql - SQL database schema
     * @returns {string[]} - Array of table names
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
     * @param {string} tableName - Table name
     * @returns {boolean} - True if the table is a system table
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
     * @param {string} query - SQL query
     * @returns {string[]} - Array of affected table names
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
     * @param {string} query - SQL query
     * @returns {boolean} - True if the query modifies data
     */
    private isWriteOperation(query: string): boolean {
        const writeCommands = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE'];
        const normalizedQuery = query.trim().toUpperCase();
        return writeCommands.some(cmd => normalizedQuery.startsWith(cmd));
    }

    /**
     * Runs a SQL query in a Docker container using provided connection details.
     * @param {any} connectionDetails - Connection details for the database.
     * @param {string} query - The query to execute.
     * @returns {Promise<QueryResult>} - The query result including execution time and errors.
     */
    async runQueryInContainer(connectionDetails: any, query: string): Promise<QueryResult> {
        console.log('=== DEBUG: DatabasesService.runQueryInContainer ===');
        console.log('Connection Details received:', connectionDetails);
        console.log('Query to execute:', query);
        
        let client: Client | null = null;
        const startTime = Date.now();
        try {
            client = new Client(connectionDetails);
            console.log('Creating client with connection details:', {
                host: connectionDetails.host,
                port: connectionDetails.port,
                database: connectionDetails.database,
                user: connectionDetails.user
            });
            console.log('Connecting to database...');
            await client.connect();
            console.log('Connected successfully, executing query...');
            const result = await client.query(query);
            const executionTimeMs = Date.now() - startTime;
            
            console.log('Query executed successfully');
            console.log('Fields:', result.fields?.map(f => f.name));
            console.log('Row count:', result.rowCount);
            console.log('First row sample:', result.rows[0]);
            console.log('Execution time:', executionTimeMs, 'ms');
            
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
            console.error('Query execution failed:', error.message);
            console.error('Error details:', error);
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
                console.log('Closing database connection...');
                await client.end();
            }
        }
    }

    /**
     * Creates a new table in the specified database.
     * @param {number} databaseId - The ID of the database.
     * @param {any} dto - DTO containing table creation data.
     * @param {number} userId - The ID of the user creating the table.
     * @param {Role | string} userRole - The role of the user.
     * @returns {Promise<{ message: string }>} - Success message.
     * @throws {ForbiddenException|NotFoundException} - If the user is not a tutor or database not found.
     */
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
     * Sanitizes PostgreSQL-specific syntax from SQL schema
     * Removes ::regclass, ::type casts, and other PostgreSQL-specific elements
     * to ensure compatibility with parsers and clean display
     * @param {string} schemaSQL - Raw SQL schema with potential PostgreSQL casts
     * @returns {string} - Cleaned SQL schema without PostgreSQL-specific syntax
     */
    private sanitizePostgreSQLSchema(schemaSQL: string): string {
        let cleanSchema = schemaSQL;
        
        // 1. Remove ::regclass casts (common in foreign key references)
        cleanSchema = cleanSchema.replace(/::regclass/g, '');
        
        // 2. Remove all other ::type casts (::text, ::integer, ::boolean, etc.)
        cleanSchema = cleanSchema.replace(/::[a-zA-Z_][a-zA-Z0-9_]*/g, '');
        
        // 3. Clean up quoted values with type casts: 'value'::type → 'value'
        cleanSchema = cleanSchema.replace(/'([^']+)'::[a-zA-Z_][a-zA-Z0-9_]*/g, "'$1'");
        
        // 4. Clean up unquoted values with type casts: value::type → value
        cleanSchema = cleanSchema.replace(/\b([a-zA-Z0-9_]+)::[a-zA-Z_][a-zA-Z0-9_]*/g, '$1');
        
        // 5. Clean up numeric casts: 123::integer → 123
        cleanSchema = cleanSchema.replace(/\b(\d+(?:\.\d+)?)::[a-zA-Z_][a-zA-Z0-9_]*/g, '$1');
        
        // 6. Remove PostgreSQL-specific function calls in defaults that might have casts
        cleanSchema = cleanSchema.replace(/nextval\(([^)]+)\)::[a-zA-Z_][a-zA-Z0-9_]*/g, 'nextval($1)');

        // 6a. Remove DEFAULT nextval('...') (with or without cast)
        cleanSchema = cleanSchema.replace(/DEFAULT\s+nextval\([^)]*\)/gi, '');
        cleanSchema = cleanSchema.replace(/DEFAULT\s+nextval\([^)]*\)::[a-zA-Z_][a-zA-Z0-9_]*/gi, '');
        
        // 7. Clean up any remaining double colons that might be left over
        cleanSchema = cleanSchema.replace(/\s+::\s+/g, ' ');
        
        // 8. Normalize whitespace and remove empty lines
        cleanSchema = cleanSchema
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove triple+ newlines
            .replace(/\s+$/gm, '') // Remove trailing whitespace
            .replace(/^\s+$/gm, ''); // Remove lines with only whitespace
        
        return cleanSchema;
    }

    /**
     * Inserts a new row into a table in the specified database
     */
    async insertRow(databaseId: number, tableName: string, data: Record<string, any>, user: User): Promise<any> {
        // Getting the database
        const database = await this.getDatabaseById(databaseId);
        if (!database) {
            throw new NotFoundException(`Database with ID ${databaseId} not found`);
        }
        // Database name (dbName) can be stored in the schemaSql field or similar
        const dbName = database.schemaSql;
        if (!dbName) {
            throw new NotFoundException('Database not properly initialized');
        }
        // Connecting to the required database
        const dbPool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: dbName
        });
        const client = await dbPool.connect();
        try {
            const columns = Object.keys(data).map(key => `"${key}"`).join(', ');
            const values = Object.values(data);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const query = `INSERT INTO "${tableName}" (${columns}) VALUES (${placeholders}) RETURNING *;`;
            const result = await client.query(query, values);
            return result.rows[0];
        } catch (error) {
            throw new BadRequestException('Failed to insert row: ' + error.message);
        } finally {
            client.release();
            await dbPool.end();
        }
    }
}
