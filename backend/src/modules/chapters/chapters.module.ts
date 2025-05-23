import { Module } from '@nestjs/common';
import { ChaptersController } from './controllers/chapters.controller';
import { ChaptersService } from './services/chapters.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ChaptersController],
    providers: [ChaptersService],
    exports: [ChaptersService],
})
export class ChaptersModule {}
