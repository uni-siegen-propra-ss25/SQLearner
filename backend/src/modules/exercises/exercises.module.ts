import { Module } from '@nestjs/common';
import { ExercisesController } from './controllers/exercises.controller';
import { ExercisesService } from './services/exercises.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TopicsModule } from '../topics/topics.module';
import { DatabasesModule } from '../databases/databases.module';

/**
 * Exercises Module manages all exercise-related functionality.
 *
 * This module handles different types of exercises including:
 * - SQL query exercises
 * - Single choice questions
 * - Multiple choice questions
 * - Free text answers
 *
 * It provides features for creating, updating, and evaluating exercises,
 * tracking student progress, and managing exercise submissions.
 * The module integrates with the Topics module to organize exercises
 * within the learning path.
 *
 * @module ExercisesModule
 */
@Module({
    imports: [PrismaModule, TopicsModule, DatabasesModule],
    controllers: [ExercisesController],
    providers: [ExercisesService],
    exports: [ExercisesService],
})
export class ExercisesModule {}
