import { Module } from '@nestjs/common';
import { DatabasesController } from './controllers/databases.controller';
import { DatabasesService } from './services/databases.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DatabasesController],
    providers: [DatabasesService],
    exports: [DatabasesService]
})
export class DatabasesModule {} 