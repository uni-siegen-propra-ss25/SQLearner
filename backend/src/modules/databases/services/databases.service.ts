import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDatabaseDto } from '../models/create-database.dto';
import { UpdateDatabaseDto } from '../models/update-database.dto';
import { Database } from '@prisma/client';

@Injectable()
export class DatabasesService {
    constructor(private readonly prisma: PrismaService) {}

    async getDatabases(userId: number): Promise<Database[]> {
        return this.prisma.database.findMany({
            where: {
                OR: [
                    { ownerId: userId },
                    // Add public databases or other conditions here if needed
                ]
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
    }

    async getDatabaseById(id: number, userId: number): Promise<Database> {
        const database = await this.prisma.database.findUnique({
            where: { id },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                exercises: {
                    select: {
                        id: true,
                        title: true,
                        type: true
                    }
                }
            }
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        // Check if user has access to this database
        if (database.ownerId !== userId) {
            // Add additional access checks here if needed
            throw new ForbiddenException('You do not have access to this database');
        }

        return database;
    }

    async createDatabase(createDatabaseDto: CreateDatabaseDto, userId: number): Promise<Database> {
        return this.prisma.database.create({
            data: {
                ...createDatabaseDto,
                ownerId: userId
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
    }

    async updateDatabase(id: number, updateDatabaseDto: UpdateDatabaseDto, userId: number): Promise<Database> {
        // Check if database exists and user owns it
        const database = await this.prisma.database.findUnique({
            where: { id }
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        if (database.ownerId !== userId) {
            throw new ForbiddenException('You do not have permission to update this database');
        }

        return this.prisma.database.update({
            where: { id },
            data: updateDatabaseDto,
            include: {
                owner: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
    }

    async deleteDatabase(id: number, userId: number): Promise<void> {
        // Check if database exists and user owns it
        const database = await this.prisma.database.findUnique({
            where: { id }
        });

        if (!database) {
            throw new NotFoundException('Database not found');
        }

        if (database.ownerId !== userId) {
            throw new ForbiddenException('You do not have permission to delete this database');
        }

        // Check if database is used in any exercises
        const exercisesUsingDatabase = await this.prisma.exercise.count({
            where: { databaseId: id }
        });

        if (exercisesUsingDatabase > 0) {
            throw new ForbiddenException('Cannot delete database as it is being used in exercises');
        }

        await this.prisma.database.delete({
            where: { id }
        });
    }
} 