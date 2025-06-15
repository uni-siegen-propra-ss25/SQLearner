import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Role } from '@prisma/client';
import { Pool } from 'pg';
import { TablesService } from './tables.service';
import { DatabasesService } from './databases.service';
import { SqlErrorException } from '../../../common/exceptions/sql-error.exception';
import { InsertTableDataDto } from '../models/table-data.dto';

@Injectable()
export class TableDataService {
    private pool: Pool;

    constructor(
        private prisma: PrismaService,
        private tablesService: TablesService,
        private databasesService: DatabasesService,
    ) {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async insertTableData(
        databaseId: number,
        tableId: number,
        dto: InsertTableDataDto,
        userId: number,
        userRole: Role | string,
    ) {
        // Validate access and get table info
        await this.databasesService.validateUserAccess(databaseId, userId, userRole);
        const table = await this.tablesService.getTable(databaseId, tableId);

        // Validate table name
        if (table.name !== dto.tableName) {
            throw new Error('Table name mismatch');
        }

        try {
            // Start a transaction
            const client = await this.pool.connect();
            try {
                await client.query('BEGIN');

                // For each row of values
                for (const values of dto.values) {
                    if (values.length !== dto.columns.length) {
                        throw new Error('Column and value count mismatch');
                    }

                    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                    
                    // Insert data into the PostgreSQL table
                    const query = `
                        INSERT INTO "${table.name}" (${dto.columns.map(name => `"${name}"`).join(', ')})
                        VALUES (${placeholders})
                    `;
                    await client.query(query, values);
                }

                await client.query('COMMIT');
                return { success: true, rowCount: dto.values.length };
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw new SqlErrorException(error);
        }
    }

    async getTableData(databaseId: number, tableId: number, limit?: number, offset?: number) {
        const table = await this.tablesService.getTable(databaseId, tableId);

        try {
            // Build the query with pagination
            const query = `
                SELECT *
                FROM "${table.name}"
                ${limit ? `LIMIT ${limit}` : ''}
                ${offset ? `OFFSET ${offset}` : ''}
            `;

            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            throw new SqlErrorException(error);
        }
    }

    async deleteTableData(databaseId: number, tableId: number, conditions: Record<string, any>, userId: number, userRole: Role | string) {
        // Validate access and get table info
        await this.databasesService.validateUserAccess(databaseId, userId, userRole);
        const table = await this.tablesService.getTable(databaseId, tableId);

        try {
            const conditionEntries = Object.entries(conditions);
            const whereClause = conditionEntries
                .map(([col, val], idx) => `"${col}" = $${idx + 1}`)
                .join(' AND ');
            const values = conditionEntries.map(([_, val]) => val);

            const query = `
                DELETE FROM "${table.name}"
                WHERE ${whereClause}
            `;

            const result = await this.pool.query(query, values);
            return { success: true, rowCount: result.rowCount };
        } catch (error) {
            throw new SqlErrorException(error);
        }
    }

    async updateTableData(
        databaseId: number,
        tableId: number,
        conditions: Record<string, any>,
        updates: Record<string, any>,
        userId: number,
        userRole: Role | string,
    ) {
        // Validate access and get table info
        await this.databasesService.validateUserAccess(databaseId, userId, userRole);
        const table = await this.tablesService.getTable(databaseId, tableId);

        try {
            const conditionEntries = Object.entries(conditions);
            const updateEntries = Object.entries(updates);
            
            const setClause = updateEntries
                .map(([col], idx) => `"${col}" = $${idx + 1}`)
                .join(', ');
            const whereClause = conditionEntries
                .map(([col], idx) => `"${col}" = $${idx + updateEntries.length + 1}`)
                .join(' AND ');
            
            const values = [...updateEntries.map(([_, val]) => val), ...conditionEntries.map(([_, val]) => val)];

            const query = `
                UPDATE "${table.name}"
                SET ${setClause}
                WHERE ${whereClause}
            `;

            const result = await this.pool.query(query, values);
            return { success: true, rowCount: result.rowCount };
        } catch (error) {
            throw new SqlErrorException(error);
        }
    }

    async truncateTable(databaseId: number, tableId: number, userId: number, userRole: Role | string) {
        // Validate access and get table info
        await this.databasesService.validateUserAccess(databaseId, userId, userRole);
        const table = await this.tablesService.getTable(databaseId, tableId);

        try {
            await this.pool.query(`TRUNCATE TABLE "${table.name}" CASCADE`);
            return { success: true };
        } catch (error) {
            throw new SqlErrorException(error);
        }
    }
}