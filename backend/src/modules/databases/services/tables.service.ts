import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Pool } from 'pg';
import { DatabasesService } from './databases.service';
import { Role } from '@prisma/client';
import { CreateTableDto } from '../models/table.dto';
import { UpdateTableDto } from '../models/update-table.dto';
import { SqlErrorException } from '../../../common/exceptions/sql-error.exception';

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
        
        const createTableSql = this.generateCreateTableSQL(dto);
        
        try {
            // Create table in PostgreSQL
            await this.pool.query(createTableSql);
            
            // Store table metadata in Prisma
            return await this.prisma.databaseTable.create({
                data: {
                    databaseId,
                    name: dto.name,
                    description: dto.description,
                    createSql: createTableSql,
                    columns: {
                        create: dto.columns.map((col, index) => ({
                            name: col.name,
                            type: col.type,
                            nullable: col.nullable,
                            primaryKey: col.isPrimaryKey,
                            autoIncrement: col.autoIncrement || false,
                            defaultValue: col.defaultValue,
                            order: index
                        }))
                    }
                },
                include: {
                    columns: true
                }
            });
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
            return await this.prisma.databaseTable.update({
                where: { id: tableId },
                data: {
                    ...(dto.name && { name: dto.name }),
                    ...(dto.description && { description: dto.description })
                },
                include: { columns: true }
            });
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