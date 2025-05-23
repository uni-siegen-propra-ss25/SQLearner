import { Module } from '@nestjs/common';
import { TopicsController } from './controllers/topics.controller';
import { TopicsService } from './services/topics.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ChaptersModule } from '../chapters/chapters.module';

@Module({
  imports: [PrismaModule, ChaptersModule],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService]
})
export class TopicsModule {} 