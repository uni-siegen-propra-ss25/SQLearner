import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateExerciseDto } from '../models/create-exercise.dto';
import { UpdateExerciseDto } from '../models/update-exercise.dto';
import { ReorderExercisesDto } from '../models/reorder-exercises.dto';
import { Exercise } from '@prisma/client';

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async getExercises(topicId: number): Promise<Exercise[]> {
    return this.prisma.exercise.findMany({
      where: { topicId },
      include: {
        database: true
      }
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

    const exercise = await this.prisma.exercise.create({
      data: {
        ...exerciseData,
        topicId: createExerciseDto.topicId,
        answers: {
          create: answers
        }
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

    // First, delete existing options if new ones are provided
    if (answers) {
      await this.prisma.answerOption.deleteMany({
        where: { exerciseId: id }
      });
    }

    const exercise = await this.prisma.exercise.update({
      where: { id },
      data: {
        ...exerciseData,
        answers: answers ? {
            create: answers
        } : undefined
      },
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

  async removeExercise(id: number): Promise<void> {
    const exercise = await this.prisma.exercise.delete({
      where: { id }
    });
    if (!exercise) {
      throw new NotFoundException('Exercise not found');
    }
    return;
  }

  async reorderExercises(topicId: number, reorderExercisesDto: ReorderExercisesDto): Promise<void> {
    const { exercises: reorderedExercises } = reorderExercisesDto;
    
    // Get current exercises to verify they belong to the topic
    const currentExercises = await this.prisma.exercise.findMany({
      where: { topicId },
      select: { id: true }
    });

    const currentIds = new Set(currentExercises.map(e => e.id));
    
    // Verify all exercises belong to the topic
    if (!reorderedExercises.every(e => currentIds.has(Number(e.id)))) {
      throw new NotFoundException('One or more exercises not found in this topic');
    }

    // Update all exercises in a single transaction
    await this.prisma.$transaction(async (tx) => {
      // First, set all exercises to a temporary negative order to avoid unique constraint conflicts
      await tx.exercise.updateMany({
        where: { topicId },
        data: { order: -1 }
      });

      // Then update each exercise with its new order
      for (const [index, exercise] of reorderedExercises.entries()) {
        await tx.exercise.update({
          where: { id: Number(exercise.id) },
          data: { order: index }
        });
      }
    });
  }
} 