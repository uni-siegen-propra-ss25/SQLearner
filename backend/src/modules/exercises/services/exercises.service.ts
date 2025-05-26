import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateExerciseDto } from '../models/create-exercise.dto';
import { UpdateExerciseDto } from '../models/update-exercise.dto';
import { ReorderExercisesDto } from '../models/reorder-exercises.dto';
import { Exercise, ExerciseType } from '@prisma/client';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async getExercises(topicId: number): Promise<Exercise[]> {
    return this.prisma.exercise.findMany({
      where: { topicId },
      include: {
        database: true,
        answers: true
      },
      orderBy: { order: 'asc' }
    });
  }

  async getExerciseById(id: number): Promise<Exercise> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: {
        answers: true,
        database: true
      }
    });
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }
    return exercise;
  }

  async createExercise(createExerciseDto: CreateExerciseDto): Promise<number> {
    const { answers, ...exerciseData } = createExerciseDto;

    // Validate that QUERY exercises have a solution and database
    if (exerciseData.type === ExerciseType.QUERY) {
      if (!exerciseData.querySolution) {
        throw new Error('SQL exercises must have a solution query');
      }
      if (!exerciseData.databaseId) {
        throw new Error('SQL exercises must be associated with a database');
      }
    }

    // Validate that CHOICE exercises have answers
    if (exerciseData.type === ExerciseType.CHOICE && (!answers || answers.length === 0)) {
      throw new Error('Choice exercises must have answer options');
    }

    const exercise = await this.prisma.exercise.create({
      data: {
        ...exerciseData,
        // Only include answers for CHOICE type
        answers: exerciseData.type === ExerciseType.CHOICE ? {
          create: answers?.map((answer, index) => ({
            ...answer,
            order: index
          }))
        } : undefined
      },    
      include: {
        answers: true,
        database: true
      }
    });
    return exercise.id;
  }

  async updateExercise(id: number, updateExerciseDto: UpdateExerciseDto): Promise<Exercise> {
    const { answers, ...exerciseData } = updateExerciseDto;

    const existingExercise = await this.prisma.exercise.findUnique({
      where: { id: Number(id) },
      include: { answers: true }
    });

    if (!existingExercise) {
      throw new NotFoundException('Exercise not found');
    }

    // If updating exercise type, validate required fields
    if (exerciseData.type) {
      if (exerciseData.type === ExerciseType.QUERY) {
        if (!exerciseData.querySolution && !existingExercise.querySolution) {
          throw new Error('SQL exercises must have a solution query');
        }
        if (!exerciseData.databaseId && !existingExercise.databaseId) {
          throw new Error('SQL exercises must be associated with a database');
        }
      }
      
      if (exerciseData.type === ExerciseType.CHOICE && 
          (!answers && !existingExercise.answers.length)) {
        throw new Error('Choice exercises must have answer options');
      }
    }

    // Handle answer options update if provided
    if (answers) {
      await this.prisma.answerOption.deleteMany({
        where: { exerciseId: Number(id) }
      });
    }

    const exercise = await this.prisma.exercise.update({
      where: { id: Number(id) },
      data: {
        ...exerciseData,
        // Only include answers for CHOICE type
        answers: (exerciseData.type || existingExercise.type) === ExerciseType.CHOICE && answers ? {
          create: answers.map((answer, index) => ({
            ...answer,
            order: index
          }))
        } : undefined
      },
      include: {
        answers: true,
        database: true
      }
    });
    
    return exercise;
  }

  async removeExercise(id: number): Promise<void> {
    // First delete related answer options to avoid foreign key constraints
    await this.prisma.answerOption.deleteMany({
      where: { exerciseId: Number(id) }
    });

    const exercise = await this.prisma.exercise.delete({
      where: { id: Number(id) }
    });
    
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }
  }

  async reorderExercises(topicId: number, reorderExercisesDto: ReorderExercisesDto): Promise<void> {
    const { exercises: reorderedExercises } = reorderExercisesDto;
    
    const currentExercises = await this.prisma.exercise.findMany({
      where: { topicId: Number(topicId) },
      select: { id: true }
    });

    const currentIds = new Set(currentExercises.map(e => e.id));
    
    if (!reorderedExercises.every(e => currentIds.has(Number(e.id)))) {
      throw new NotFoundException('One or more exercises not found in this topic');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.exercise.updateMany({
        where: { topicId: Number(topicId) },
        data: { order: -1 }
      });

      for (const exercise of reorderedExercises) {
        await tx.exercise.update({
          where: { id: Number(exercise.id) },
          data: { order: Number(exercise.order) }
        });
      }
    });
  }
}