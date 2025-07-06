import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateExerciseDto, AnswerOptionDto } from '../models/create-exercise.dto';
import { UpdateExerciseDto } from '../models/update-exercise.dto';
import { Exercise, ExerciseType } from '@prisma/client';
import { DatabasesService } from '../../databases/services/databases.service';
import { ProgressService } from '../../progress/services/progress.service';
import { SqlEvaluationService } from '../../sql-evaluation/services/sql-evaluation.service';

/**
 * Service handling business logic for exercise-related operations.
 * Manages the creation, update, deletion, and ordering of exercises within topics.
 * Supports various exercise types including SQL queries, multiple choice, and free text.
 * Provides evaluation logic for Single Choice and Multiple Choice exercises with instant feedback.
 * 
 * @class ExercisesService
 */
@Injectable()
export class ExercisesService {    /**
     * Erstellt eine neue Instanz des ExercisesService.
     * 
     * @param {PrismaService} prisma - Prisma ORM Service für Datenbankoperationen
     * @param {DatabasesService} databasesService - Service für SQL Query-Ausführung
     * @param {ProgressService} progressService - Service für Lernfortschritt-Tracking
     * @param {SqlEvaluationService} sqlEvaluationService - Service für automatische SQL-Query-Bewertung
     */
    constructor(
        private readonly prisma: PrismaService,
        private readonly databasesService: DatabasesService,
        private readonly progressService: ProgressService,
        private readonly sqlEvaluationService: SqlEvaluationService,
    ) {}

    /**
     * Retrieves all exercises within a topic.
     *
     * @param {number} topicId - The ID of the topic whose exercises to retrieve
     * @returns {Promise<Exercise[]>} Promise resolving to an array of Exercise objects with associated data
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
     * @param {number} id - The ID of the exercise to retrieve
     * @returns {Promise<Exercise>} Promise resolving to the Exercise object with associated data
     * @throws {NotFoundException} if the exercise does not exist
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
     * @returns {Promise<Exercise[]>} Promise resolving to an array of Exercise objects with associated data
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
     * @param {ExerciseType} type - The type of exercise (SINGLE_CHOICE or MULTIPLE_CHOICE)
     * @param {AnswerOptionDto[]} answers - The answer options to validate
     * @throws {Error} if answers are invalid for the exercise type
     * @private
     */
    private validateAnswers(type: ExerciseType, answers?: AnswerOptionDto[]): void {
        if (!answers || answers.length === 0) return;

        console.log('=== DEBUG: validateAnswers ===');
        console.log('Exercise type:', type);
        console.log('Answers count:', answers.length);
        console.log('Answers:', answers.map(a => ({ text: a.text, isCorrect: a.isCorrect })));

        if (type === ExerciseType.SINGLE_CHOICE) {
            const correctCount = answers.filter((a) => a.isCorrect).length;
            console.log('Correct answers count for SINGLE_CHOICE:', correctCount);
            if (correctCount !== 1) {
                throw new BadRequestException('Single choice exercises must have exactly one correct answer');
            }
        } else if (type === ExerciseType.MULTIPLE_CHOICE) {
            const correctCount = answers.filter((a) => a.isCorrect).length;
            console.log('Correct answers count for MULTIPLE_CHOICE:', correctCount);
            if (correctCount === 0) {
                throw new BadRequestException('Multiple choice exercises must have at least one correct answer');
            }
        }
    }

    /**
     * Creates a new exercise in a topic.
     *
     * @param {CreateExerciseDto} createExerciseDto - The data for creating the new exercise
     * @returns {Promise<number>} Promise resolving to the ID of the created exercise
     * @throws {BadRequestException} if the exercise data is invalid
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
     * @param {number} id - The ID of the exercise to update
     * @param {UpdateExerciseDto} updateExerciseDto - The data to update the exercise with
     * @returns {Promise<Exercise>} Promise resolving to the updated Exercise object
     * @throws {NotFoundException} if the exercise does not exist
     * @throws {BadRequestException} if the update data is invalid
     */
    async updateExercise(id: number, updateExerciseDto: UpdateExerciseDto): Promise<Exercise> {
        console.log('=== DEBUG: updateExercise ===');
        console.log('Exercise ID:', id);
        console.log('Update DTO:', JSON.stringify(updateExerciseDto, null, 2));
        
        const existingExercise = await this.getExerciseById(id);
        console.log('Existing exercise type:', existingExercise.type);
        
        const { answers, id: exerciseId, ...exerciseData } = updateExerciseDto; // Remove id from exerciseData
        console.log('Exercise data after destructuring:', exerciseData);
        console.log('Answers:', answers);

        // Validate answers if provided for choice-type exercises
        if (exerciseData.type) {
            this.validateAnswers(exerciseData.type, answers);
        } else if (answers) {
            this.validateAnswers(existingExercise.type, answers);
        }

        // Handle answers update for choice exercises
        let answersUpdate: any = undefined;
        if (answers && (
            exerciseData.type === ExerciseType.SINGLE_CHOICE ||
            exerciseData.type === ExerciseType.MULTIPLE_CHOICE ||
            existingExercise.type === ExerciseType.SINGLE_CHOICE ||
            existingExercise.type === ExerciseType.MULTIPLE_CHOICE
        )) {
            // Delete existing answers first
            await this.prisma.answerOption.deleteMany({
                where: { exerciseId: id },
            });

            // Create new answers (ignore any id from frontend)
            answersUpdate = {
                create: answers.map((answer, index) => ({
                    text: answer.text,
                    isCorrect: answer.isCorrect,
                    order: index,
                })),
            };
        }

        const exercise = await this.prisma.exercise.update({
            where: { id },
            data: {
                ...exerciseData,
                answers: answersUpdate,
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
     * @param {number} id - The ID of the exercise to remove
     * @throws {NotFoundException} if the exercise does not exist
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
     * @param {number} id - The ID of the exercise to run the query for
     * @param {string} query - The query to run
     * @param {object} connectionDetails - Optional connection details for the database
     * @returns {Promise<{columns: string[]; rows: any[]}>} Promise resolving to the query result
     * @throws {NotFoundException} if the exercise or database does not exist
     */
    async runQuery(id: number, query: string, connectionDetails?: { host: string; port: number }): Promise<{ columns: string[]; rows: any[] }> {
        console.log('=== DEBUG: ExercisesService.runQuery ===');
        console.log('Exercise ID:', id);
        console.log('Query:', query);
        console.log('Connection Details:', connectionDetails);
        
        const exercise = await this.prisma.exercise.findUnique({
            where: { id },
            include: {
                database: true,
            },
        });

        console.log('Exercise found:', exercise?.id);
        console.log('Exercise type:', exercise?.type);
        console.log('Exercise database ID:', exercise?.database?.id);

        if (!exercise) {
            throw new NotFoundException('Exercise not found');
        }

        if (!exercise.database) {
            throw new NotFoundException('Exercise has no associated database');
        }        
        
        // If it's a query exercise, a container may be needed.
        if (exercise.type === ExerciseType.QUERY) {
            console.log('Running query for QUERY exercise type');
            console.log('Using connectionDetails:', !!connectionDetails);
            
            const result = connectionDetails
            ? await this.databasesService.runQueryInContainer({
                ...connectionDetails,
                database: 'exercise_db' // Use the correct database name from the container
              }, query)
            : await this.databasesService.runQuery(exercise.database.id, query);

            console.log('Query result received:', result);

            let columns: string[];
            if ('fields' in result && Array.isArray(result.fields)) {
                columns = result.fields.map((field: any) => field.name);
            } else if ('columns' in result && Array.isArray(result.columns)) {
                columns = result.columns;
            } else {
                columns = [];
            }

            console.log('Processed columns:', columns);
            console.log('Row count:', result.rows?.length || 0);

            return {
                columns: columns,
                rows: result.rows || [],
            };
        }

        return {
            columns: [],
            rows: [],
        };
    }

    /**
     * Submits and evaluates an answer for an exercise.
     * Handles different exercise types: Single/Multiple Choice and SQL queries.
     *
     * @param {number} id - The ID of the exercise
     * @param {string} answerText - The submitted answer
     * @param {number} userId - The ID of the user submitting the answer
     * @param {object} connectionDetails - Optional connection details for the database
     * @returns {Promise<any>} Promise resolving to the evaluation result
     * @throws {NotFoundException} if the exercise does not exist
     */
    async submitAnswer(
        id: number,
        answerText: string,
        userId: number,
        connectionDetails?: { host: string; port: number }
    ) {
        const exercise = await this.getExerciseById(id);

        let result: { isCorrect: boolean; feedback: string };

        if (exercise.type === ExerciseType.SINGLE_CHOICE) {
            result = this.evaluateSingleChoice(exercise, answerText);
        } else if (exercise.type === ExerciseType.MULTIPLE_CHOICE) {
            result = this.evaluateMultipleChoice(exercise, answerText);
        } else if (exercise.type === ExerciseType.QUERY || exercise.type === ExerciseType.FREETEXT) {
            if (!exercise.databaseId || !exercise.solution) {
                throw new BadRequestException('Exercise is not configured correctly for evaluation.');
            }
            const evaluationResult = await this.sqlEvaluationService.evaluateQuery(
                answerText,
                exercise.solution,
                exercise.databaseId,
                connectionDetails,
            );
            result = {
                isCorrect: evaluationResult.isCorrect,
                feedback: evaluationResult.feedback,
            };
        } else {
            throw new BadRequestException('Unsupported exercise type');
        }

        if (result.isCorrect) {
            await this.progressService.updateExerciseProgress(userId, id, { exerciseId: id, isPassed: true });
        }

        return {
            ...result,
            exerciseId: id,
            userId
        };
    }

    /**
     * Evaluiert eine Single Choice Aufgabe gegen die korrekte Antwort.
     * Prüft ob die ausgewählte Option korrekt ist und generiert entsprechendes Feedback in deutscher Sprache.
     *
     * @param {any} exercise - Die Aufgabe mit Antwortoptionen
     * @param {string} answerText - Die ausgewählte Option ID als String
     * @returns {{isCorrect: boolean; feedback: string}} Evaluierungsergebnis mit Korrektheit und Feedback
     * @private
     */
    private evaluateSingleChoice(
        exercise: any,
        answerText: string,
    ): { isCorrect: boolean; feedback: string } {
        const selectedOptionId = parseInt(answerText, 10);
        
        if (isNaN(selectedOptionId)) {
            return {
                isCorrect: false,
                feedback: 'Ungültiges Antwortformat. Bitte wählen Sie eine gültige Option aus.',
            };
        }

        const selectedOption = exercise.answers.find((option: any) => option.id === selectedOptionId);
        
        if (!selectedOption) {
            return {
                isCorrect: false,
                feedback: 'Ausgewählte Option wurde nicht gefunden.',
            };
        }        const isCorrect = selectedOption.isCorrect;
        
        const feedback = isCorrect
            ? '✅ Richtig! Gut gemacht.'
            : '❌ Falsch. Versuchen Sie es noch einmal!';

        return { isCorrect, feedback };
    }

    /**
     * Evaluiert eine Multiple Choice Aufgabe gegen alle korrekten Antworten.
     * Prüft ob alle und nur die korrekten Optionen ausgewählt wurden und generiert entsprechendes Feedback.
     *
     * @param {any} exercise - Die Aufgabe mit Antwortoptionen
     * @param {string} answerText - Die ausgewählten Option IDs als komma-separierter String
     * @returns {{isCorrect: boolean; feedback: string}} Evaluierungsergebnis mit Korrektheit und Feedback
     * @private
     */
    private evaluateMultipleChoice(
        exercise: any,
        answerText: string,
    ): { isCorrect: boolean; feedback: string } {
        const selectedOptionIds = answerText
            .split(',')
            .map(id => parseInt(id.trim(), 10))
            .filter(id => !isNaN(id));

        if (selectedOptionIds.length === 0) {
            return {
                isCorrect: false,
                feedback: 'Bitte wählen Sie mindestens eine Option aus.',
            };
        }

        // Alle korrekten Option IDs ermitteln
        const correctOptionIds = exercise.answers
            .filter((option: any) => option.isCorrect)
            .map((option: any) => option.id)
            .sort();        // Prüfen ob die ausgewählten Optionen exakt den korrekten entsprechen
        const selectedSorted = selectedOptionIds.sort();
        const isCorrect = JSON.stringify(selectedSorted) === JSON.stringify(correctOptionIds);

        const feedback = isCorrect
            ? '✅ Richtig! Sie haben alle richtigen Antworten ausgewählt.'
            : '❌ Falsch. Versuchen Sie es noch einmal!';

        return { isCorrect, feedback };
    }
}
