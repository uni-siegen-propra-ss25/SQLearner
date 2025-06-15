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
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async createDatabase(dto: CreateDatabaseDto, userId: number, userRole: Role | string) {
        if (String(userRole).toUpperCase() !== Role.TUTOR) {
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

        // Create database schema if provided
        if (dto.schemaSql) {
            try {
                await this.pool.query(dto.schemaSql);
            } catch (error) {
                // Clean up the database record if schema creation fails
                await this.prisma.database.delete({
                    where: { id: database.id }
                });
                throw new SqlErrorException(error);
            }
        }

        return database;
    }

    async getAllDatabases() {
        return this.prisma.database.findMany({
            orderBy: { createdAt: 'desc' },
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

    async updateDatabase(id: number, dto: UpdateDatabaseDto, userId: number, userRole: Role | string) {
        const database = await this.getDatabaseById(id);

        if (String(userRole).toUpperCase() !== Role.TUTOR || database.ownerId !== userId) {
            throw new ForbiddenException('Only the creator tutor can update this database');
        }

        return this.prisma.database.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
            },
        });
    }

    async deleteDatabase(id: number, userId: number, userRole: Role | string) {
        const database = await this.getDatabaseById(id);

        if (String(userRole).toUpperCase() !== Role.TUTOR || database.ownerId !== userId) {
            throw new ForbiddenException('Only the creator tutor can delete this database');
        }

        // Delete database schema
        if (database.schemaSql) {
            try {
                // Extract table names from schema and drop them
                const tableMatches = database.schemaSql.match(/CREATE TABLE\s+(\w+)/g);
                if (tableMatches) {
                    for (const match of tableMatches) {
                        const tableName = match.split(/\s+/)[2];
                        await this.pool.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
                    }
                }
            } catch (error) {
                throw new SqlErrorException(error);
            }
        }

        // Delete database record
        return this.prisma.database.delete({
            where: { id }
        });
    }

    async validateUserAccess(databaseId: number, userId: number, userRole: Role | string) {
        const database = await this.getDatabaseById(databaseId);
        if (String(userRole).toUpperCase() !== Role.TUTOR || database.ownerId !== userId) {
            throw new ForbiddenException('Only the creator tutor can modify this database');
        }
        return database;
    }

    private isWriteOperation(query: string): boolean {
        const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE'];
        const upperQuery = query.toUpperCase();
        return writeKeywords.some(keyword => upperQuery.includes(keyword));
    }

    async runQuery(databaseId: number, query: string) {
        await this.getDatabaseById(databaseId);

        // For safety, prevent any write operations through the query endpoint
        if (this.isWriteOperation(query)) {
            throw new ForbiddenException('Write operations are not allowed through this endpoint');
        }

        try {
            const result = await this.pool.query(query);
            return {
                success: true,
                rows: result.rows,
                rowCount: result.rowCount,
                fields: result.fields.map(f => ({
                    name: f.name,
                    dataType: f.dataTypeID
                }))
            };
        } catch (error) {
            throw new SqlErrorException(error);
        }
    }
}
