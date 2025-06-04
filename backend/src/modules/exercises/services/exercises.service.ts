import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateExerciseDto, AnswerOptionDto } from '../models/create-exercise.dto';
import { UpdateExerciseDto } from '../models/update-exercise.dto';
import { Exercise, ExerciseType } from '@prisma/client';
import { DatabasesService } from '../../databases/services/databases.service';

/**
 * Service handling business logic for exercise-related operations.
 * Manages the creation, update, deletion, and ordering of exercises within topics.
 * Supports various exercise types including SQL queries, multiple choice, and free text.
 */
@Injectable()
export class ExercisesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly databasesService: DatabasesService,
    ) {}

    /**
     * Retrieves all exercises within a topic.
     *
     * @param topicId - The ID of the topic whose exercises to retrieve
     * @returns Promise resolving to an array of Exercise objects with associated data
     */
    async getExercises(topicId: number): Promise<Exercise[]> {
        return this.prisma.exercise.findMany({
            where: { topicId },
            include: {
                database: true,
                answers: true,
            },
            orderBy: { order: 'asc' },
        });
    }

    /**
     * Retrieves a specific exercise by ID.
     *
     * @param id - The ID of the exercise to retrieve
     * @returns Promise resolving to the Exercise object with associated data
     * @throws NotFoundException if the exercise does not exist
     */
    async getExerciseById(id: number): Promise<Exercise> {
        const exercise = await this.prisma.exercise.findUnique({
            where: { id },
            include: {
                answers: true,
                database: true,
            },
        });
        if (!exercise) {
            throw new NotFoundException('Exercise not found');
        }
        return exercise;
    }

    /**
     * Retrieves all exercises.
     *
     * @returns Promise resolving to an array of Exercise objects with associated data
     */
    async getAllExercises(): Promise<Exercise[]> {
        return this.prisma.exercise.findMany({
            include: {
                database: true,
                answers: true,
            },
            orderBy: { order: 'asc' },
        });
    }

    /**
     * Validates the answers for choice-type exercises.
     *
     * @param type - The type of exercise (SINGLE_CHOICE or MULTIPLE_CHOICE)
     * @param answers - The answer options to validate
     * @throws BadRequestException if answers are invalid for the exercise type
     * @private
     */
    private validateAnswers(type: ExerciseType, answers?: AnswerOptionDto[]): void {
        if (!answers || answers.length === 0) return;

        if (type === ExerciseType.SINGLE_CHOICE) {
            const correctCount = answers.filter((a) => a.isCorrect).length;
            if (correctCount !== 1) {
                throw new Error('Single choice exercises must have exactly one correct answer');
            }
        } else if (type === ExerciseType.MULTIPLE_CHOICE) {
            const correctCount = answers.filter((a) => a.isCorrect).length;
            if (correctCount === 0) {
                throw new Error('Multiple choice exercises must have at least one correct answer');
            }
        }
    }

    /**
     * Creates a new exercise in a topic.
     *
     * @param createExerciseDto - The data for creating the new exercise
     * @returns Promise resolving to the ID of the created exercise
     * @throws BadRequestException if the exercise data is invalid
     */
    async createExercise(createExerciseDto: CreateExerciseDto): Promise<number> {
        const { answers, ...exerciseData } = createExerciseDto;

        // Validate answers for choice-type exercises
        this.validateAnswers(exerciseData.type, answers);

        // Determine order if not provided
        if (!exerciseData.order) {
            const lastExercise = await this.prisma.exercise.findFirst({
                where: { topicId: createExerciseDto.topicId },
                orderBy: { order: 'desc' },
                take: 1,
            });
            exerciseData.order = lastExercise ? lastExercise.order + 1 : 0;
        }

        const exercise = await this.prisma.exercise.create({
            data: {
                ...exerciseData,
                ...(answers
                    ? {
                          answers: {
                              create: answers.map((answer, index) => ({
                                  ...answer,
                                  order: index,
                              })),
                          },
                      }
                    : {}),
            },
            include: {
                answers: true,
                database: true,
            },
        });

        return exercise.id;
    }

    /**
     * Updates an existing exercise.
     *
     * @param id - The ID of the exercise to update
     * @param updateExerciseDto - The data to update the exercise with
     * @returns Promise resolving to the updated Exercise object
     * @throws NotFoundException if the exercise does not exist
     * @throws BadRequestException if the update data is invalid
     */
    async updateExercise(id: number, updateExerciseDto: UpdateExerciseDto): Promise<Exercise> {
        const existingExercise = await this.getExerciseById(id);
        const { answers, ...exerciseData } = updateExerciseDto;

        // Validate answers if provided for choice-type exercises
        if (exerciseData.type) {
            this.validateAnswers(exerciseData.type, answers);
        } else if (answers) {
            this.validateAnswers(existingExercise.type, answers);
        }

        // Delete existing answers if new ones are provided
        if (answers) {
            await this.prisma.answerOption.deleteMany({
                where: { exerciseId: id },
            });
        }

        const exercise = await this.prisma.exercise.update({
            where: { id },
            data: {
                ...exerciseData,
                answers:
                    (exerciseData.type === ExerciseType.SINGLE_CHOICE ||
                        exerciseData.type === ExerciseType.MULTIPLE_CHOICE ||
                        existingExercise.type === ExerciseType.SINGLE_CHOICE ||
                        existingExercise.type === ExerciseType.MULTIPLE_CHOICE) &&
                    answers
                        ? {
                              create: answers.map((answer, index) => ({
                                  ...answer,
                                  order: index,
                              })),
                          }
                        : undefined,
            },
            include: {
                answers: true,
                database: true,
            },
        });

        return exercise;
    }

    /**
     * Removes an exercise and its associated data.
     *
     * @param id - The ID of the exercise to remove
     * @throws NotFoundException if the exercise does not exist
     */
    async removeExercise(id: number): Promise<void> {
        await this.getExerciseById(id);
        await this.prisma.exercise.delete({
            where: { id },
        });
    }

    /**
     * Runs a SQL query for an exercise.
     *
     * @param id - The ID of the exercise to run the query for
     * @param query - The query to run
     * @returns Promise resolving to the query result
     * @throws NotFoundException if the exercise or database does not exist
     */
    async runQuery(id: number, query: string): Promise<{ columns: string[]; rows: any[] }> {
        const exercise = await this.prisma.exercise.findUnique({
            where: { id },
            include: {
                database: true,
            },
        });

        if (!exercise) {
            throw new NotFoundException('Exercise not found');
        }

        if (!exercise.database) {
            throw new NotFoundException('Exercise has no associated database');
        }

        return this.databasesService.runQuery(exercise.database.id, query);
    }
}
