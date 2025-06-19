import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Role, User, ContainerStatus } from '@prisma/client';
import { SqlErrorException } from '../../../common/exceptions/sql-error.exception';
import { DockerService } from '../../docker/services/docker.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Injectable()
export class DatabasesService {
    private readonly logger = new Logger(DatabasesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly dockerService: DockerService
    ) {}

    async getAllDatabases() {
        
    }

    async getDatabaseById(id: number) {
        
    }

    async createDatabase(file: Express.Multer.File, user: User) {
        
    }

    async updateDatabase(databaseId: number, user: User, file: Express.Multer.File) {
    
    }

    async deleteDatabase(id: number, user: User) {
        
    }

    private isWriteOperation(query: string): boolean {
        const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE'];
        const upperQuery = query.toUpperCase();
        return writeKeywords.some(keyword => upperQuery.includes(keyword));
    }

    async runQuery(databaseId: number, query: string) { 
        //TODO: implement via session 
        return {
            columns: [],
            fields: [],
            rows: [],
            rowCount: 0,
            executionTimeMs: 0
        };
    }
}
