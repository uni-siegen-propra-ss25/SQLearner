import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Database } from '../models/database.model';
import { CreateDatabaseDto } from '../models/create-database.dto';
import { UpdateDatabaseDto } from '../models/update-database.dto';
import { Role } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class DatabasesService {
    private pool: Pool;

    constructor(private prisma: PrismaService) {
        // Инициализируем пул соединений с PostgreSQL
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }

    async createDatabase(dto: CreateDatabaseDto, userId: number, userRole: Role | string) {
        console.log('=== Database Creation Debug ===');
        console.log('User ID:', userId);
        console.log('User Role (raw):', userRole);
        console.log('User Role Type:', typeof userRole);
        console.log('Role.TUTOR:', Role.TUTOR);
        console.log('Role.TUTOR Type:', typeof Role.TUTOR);
        console.log('Direct comparison:', userRole === Role.TUTOR);
        console.log('String comparison:', userRole === 'TUTOR');
        console.log('Case-insensitive comparison:', String(userRole).toUpperCase() === 'TUTOR');
        console.log('===========================');

        if (String(userRole).toUpperCase() !== 'TUTOR') {
            throw new ForbiddenException('Only tutors can create databases');
        }

        // Создаем запись в таблице Database
        const database = await this.prisma.database.create({
            data: {
                name: dto.name,
                description: dto.description,
                schemaSql: dto.schemaSql,
                ownerId: userId,
            },
        });

        try {
            // Выполняем SQL схему
            if (dto.schemaSql) {
                await this.pool.query(dto.schemaSql);
                console.log('SQL schema executed successfully');
            }
        } catch (error) {
            console.error('Error executing SQL schema:', error);
            // Можно добавить дополнительную обработку ошибок здесь
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

    async updateDatabase(id: number, dto: UpdateDatabaseDto, userId: number, userRole: Role | string) {
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

        return this.prisma.database.delete({
            where: { id },
        });
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
            // Выполняем SQL схему из файла
            if (schema) {
                await this.pool.query(schema);
                console.log('SQL schema from file executed successfully');
            }
        } catch (error) {
            console.error('Error executing SQL schema from file:', error);
        }

        return database;
    }
}
