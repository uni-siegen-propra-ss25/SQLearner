import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Pool } from 'pg';
import { DatabasesService } from './databases.service';
import { Role } from '@prisma/client';
import { CreateTableDto } from '../models/table.dto';
import { UpdateTableDto } from '../models/update-table.dto';
import { SqlErrorException } from '../../../common/exceptions/sql-error.exception';
import { Table } from 'typeorm';

@Injectable()
export class TablesService {
    private pool: Pool;

    constructor(
        private prisma: PrismaService,
        private databasesService: DatabasesService
    ) {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async createTable(databaseId: number, dto: CreateTableDto, userId: number, userRole: Role | string) {
        await this.databasesService.validateUserAccess(databaseId, userId, userRole);
        
        // Check if table exists in Prisma metadata
        const existingTable = await this.prisma.databaseTable.findFirst({
            where: {
                databaseId,
                name: dto.name
            }
        });

        if (existingTable) {
            throw new BadRequestException(`Table with name "${dto.name}" already exists in this database`);
        }

        // Get database info to determine the schema context
        const database = await this.databasesService.getDatabaseById(databaseId);
        const databaseSchema = `db_${databaseId}`;

        try {
            // Create schema if it doesn't exist (idempotent)
            await this.pool.query(`CREATE SCHEMA IF NOT EXISTS "${databaseSchema}"`);

            // Connect to the specific schema
            await this.pool.query(`SET search_path TO "${databaseSchema}"`);

            // Check if table exists in this specific schema
            const result = await this.pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = $1
                    AND table_type = 'BASE TABLE'
                    AND table_name = $2
                )
            `, [databaseSchema, dto.name]);

            if (result.rows[0].exists) {
                console.log(`Found orphaned table "${dto.name}" in schema "${databaseSchema}", dropping it...`);
                await this.pool.query(`DROP TABLE IF EXISTS "${databaseSchema}"."${dto.name}" CASCADE`);
            }
        } catch (error) {
            console.error('Error checking table existence:', error);
            throw new SqlErrorException(error);
        }
        
        const createTableSql = this.generateCreateTableSQL(dto);
        
        try {
            // Create table in PostgreSQL (in the correct schema)
            console.log(`Creating table in schema "${databaseSchema}" with SQL:`, createTableSql);
            await this.pool.query(`SET search_path TO "${databaseSchema}"`);
            await this.pool.query(createTableSql);
            
            // Store table metadata in Prisma
            const table = await this.prisma.databaseTable.create({
                data: {
                    databaseId,
                    name: dto.name,
                    description: dto.description,
                    createSql: createTableSql,
                    columns: {
                        create: dto.columns.map(col => ({
                            name: col.name,
                            type: col.type,
                            nullable: col.nullable,
                            primaryKey: col.isPrimaryKey,
                            isForeignKey: col.isForeignKey || false,
                            defaultValue: col.defaultValue,
                            autoIncrement: col.autoIncrement || false,
                            referencesTable: col.referencesTable,
                            referencesColumn: col.referencesColumn,
                            order: 0
                        }))
                    }
                },
                include: {
                    columns: true
                }
            });

            // Clean the response using the interceptor
            return {
                name: table.name,
                description: table.description,
                columns: table.columns.map(col => ({
                    name: col.name,
                    type: col.type,
                    nullable: col.nullable,
                    isPrimaryKey: col.primaryKey,
                    isForeignKey: col.isForeignKey,
                    defaultValue: col.defaultValue,
                    autoIncrement: col.autoIncrement,
                    referencesTable: col.referencesTable,
                    referencesColumn: col.referencesColumn
                }))
            };
        } catch (error) {
            throw new SqlErrorException(error);
        }
    }

    async getTables(databaseId: number) {
        await this.databasesService.getDatabaseById(databaseId);
        
        return this.prisma.databaseTable.findMany({
            where: { databaseId },
            include: { columns: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getTable(databaseId: number, tableId: number) {
        await this.databasesService.getDatabaseById(databaseId);
        
        const table = await this.prisma.databaseTable.findFirst({
            where: { 
                id: tableId,
                databaseId 
            },
            include: { columns: true }
        });

        if (!table) {
            throw new NotFoundException(`Table with ID ${tableId} not found in database ${databaseId}`);
        }

        return table;
    }

    async updateTable(databaseId: number, tableId: number, dto: UpdateTableDto, userId: number, userRole: Role | string) {
        await this.databasesService.validateUserAccess(databaseId, userId, userRole);
        const table = await this.getTable(databaseId, tableId);
        
        try {
            // Update table in PostgreSQL
            if (dto.name && dto.name !== table.name) {
                await this.pool.query(`ALTER TABLE "${table.name}" RENAME TO "${dto.name}"`);
            }
            
            // Update table metadata in Prisma
            const updatedTable = await this.prisma.databaseTable.update({
                where: { id: tableId },
                data: {
                    ...(dto.name && { name: dto.name }),
                    ...(dto.description && { description: dto.description })
                },
                include: { columns: true }
            });

            // Transform the response to match the DTO structure
            return {
                id: updatedTable.id,
                name: updatedTable.name,
                description: updatedTable.description,
                columns: updatedTable.columns.map(col => ({
                    name: col.name,
                    type: col.type,
                    nullable: col.nullable,
                    isPrimaryKey: col.primaryKey,
                    isForeignKey: col.isForeignKey,
                    defaultValue: col.defaultValue,
                    autoIncrement: col.autoIncrement,
                    ...(col.referencesTable && { referencesTable: col.referencesTable }),
                    ...(col.referencesColumn && { referencesColumn: col.referencesColumn })
                }))
            };
        } catch (error) {
            throw new SqlErrorException(error);
        }
    }

    async deleteTable(databaseId: number, tableId: number, userId: number, userRole: Role | string) {
        await this.databasesService.validateUserAccess(databaseId, userId, userRole);
        const table = await this.getTable(databaseId, tableId);
        
        try {
            // Drop table in PostgreSQL
            await this.pool.query(`DROP TABLE IF EXISTS "${table.name}" CASCADE`);
            
            // Delete table metadata from Prisma
            return await this.prisma.databaseTable.delete({
                where: { id: tableId }
            });
        } catch (error) {
            throw new SqlErrorException(error);
        }
    }

    private generateCreateTableSQL(dto: CreateTableDto): string {
        const columnDefinitions = dto.columns.map(col => {
            let def = `"${col.name}" ${col.type}`;
            
            if (col.isPrimaryKey) {
                def += ' PRIMARY KEY';
            }
            
            if (col.autoIncrement) {
                if (col.type.toLowerCase() === 'integer') {
                    def = `"${col.name}" SERIAL`;
                } else if (col.type.toLowerCase() === 'bigint') {
                    def = `"${col.name}" BIGSERIAL`;
                }
            }
            
            if (!col.nullable) {
                def += ' NOT NULL';
            }
            
            if (col.defaultValue) {
                def += ` DEFAULT ${col.defaultValue}`;
            }
            
            if (col.isForeignKey && col.referencesTable && col.referencesColumn) {
                def += ` REFERENCES "${col.referencesTable}"("${col.referencesColumn}")`;
            }
            
            return def;
        });

        return `CREATE TABLE "${dto.name}" (\n  ${columnDefinitions.join(',\n  ')}\n)`;
    }
}