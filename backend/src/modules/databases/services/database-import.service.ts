import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { Pool } from 'pg';
import { SqlErrorException } from '../../../common/exceptions/sql-error.exception';

@Injectable()
export class DatabaseImportService {
    private pool: Pool;
    private systemTables = ['pg_catalog', 'information_schema'];

    constructor(private prisma: PrismaService) {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async uploadSqlFile(file: Express.Multer.File, userId: number, userRole: Role | string) {
        if (String(userRole).toUpperCase() !== Role.TUTOR) {
            throw new ForbiddenException('Only tutors can upload SQL files');
        }

        const schema = file.buffer.toString();
        let client;

        try {
            // First validate and execute the SQL in a transaction
            client = await this.pool.connect();
            await client.query('BEGIN');

            // Parse and validate the SQL to extract table information
            const tableNames = this.extractTableNames(schema);
            if (tableNames.some(table => this.isSystemTable(table))) {
                throw new ForbiddenException('Attempting to modify system tables is not allowed');
            }

            const tableQueries = schema.split(';')
                .map(q => q.trim())
                .filter(q => q.length > 0);
            
            // Execute each statement in order
            for (const query of tableQueries) {
                await client.query(query);
            }

            // If all SQL executed successfully, commit and create the database record
            await client.query('COMMIT');

            // Create database record
            const database = await this.prisma.database.create({
                data: {
                    name: file.originalname.replace('.sql', ''),
                    description: 'Imported from SQL file',
                    schemaSql: schema,
                    ownerId: userId,
                },
            });

            // Extract and store table metadata
            for (const tableName of tableNames) {
                // Get table information from PostgreSQL
                const tableInfoResult = await this.pool.query(`
                    SELECT 
                        column_name,
                        data_type,
                        is_nullable,
                        column_default,
                        ordinal_position
                    FROM information_schema.columns 
                    WHERE table_name = $1
                    ORDER BY ordinal_position
                `, [tableName]);

                // Extract CREATE TABLE statement for this table
                const createTableMatch = schema.match(
                    new RegExp(`CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?["']?${tableName}["']?[^;]+;`, 'i')
                );
                const createTableSql = createTableMatch ? createTableMatch[0] : '';

                // Create table metadata in Prisma
                await this.prisma.databaseTable.create({
                    data: {
                        databaseId: database.id,
                        name: tableName,
                        description: `Imported from ${file.originalname}`,
                        createSql: createTableSql,
                        columns: {
                            create: tableInfoResult.rows.map(col => ({
                                name: col.column_name,
                                type: col.data_type.toUpperCase(),
                                nullable: col.is_nullable === 'YES',
                                defaultValue: col.column_default,
                                order: col.ordinal_position - 1
                            }))
                        }
                    }
                });
            }

            return database;
        } catch (error) {
            if (client) {
                await client.query('ROLLBACK');
            }
            throw new SqlErrorException(error);
        } finally {
            if (client) {
                client.release();
            }
        }
    }

    extractTableNames(schema: string): string[] {
        const tableNames: string[] = [];
        const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["']?(\w+)["']?/gi;
        
        let match;
        while ((match = createTableRegex.exec(schema)) !== null) {
            tableNames.push(match[1]);
        }

        return tableNames;
    }

    isSystemTable(tableName: string): boolean {
        return this.systemTables.some(prefix => tableName.startsWith(prefix));
    }
}