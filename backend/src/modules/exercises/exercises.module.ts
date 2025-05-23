import { Module } from '@nestjs/common';
import { ExercisesController } from './controllers/exercises.controller';
import { ExercisesService } from './services/exercises.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TopicsModule } from '../topics/topics.module';

@Module({
  imports: [PrismaModule, TopicsModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService]
})
export class ExercisesModule {} 