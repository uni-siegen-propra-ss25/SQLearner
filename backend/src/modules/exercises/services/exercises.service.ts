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
     * @returns {Promise<{columns: string[]; rows: any[]}>} Promise resolving to the query result
     * @throws {NotFoundException} if the exercise or database does not exist
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
        
        const result = await this.databasesService.runQuery(exercise.database.id, query);
        return {
            columns: result.fields ? result.fields.map((f: any) => f.name) : [],
            rows: result.rows,
        };
    }    
    
    /**
     * Submits an answer for exercises.
     * Evaluates the answer for correctness and saves progress to database.
     * Supports SQL Query, Single Choice, and Multiple Choice exercises.
     * Provides instant feedback with German messages and updates user progress for correct answers.
     *
     * @param {number} id - The ID of the exercise to submit an answer for
     * @param {string} answerText - The answer text (SQL query for QUERY exercises, selected option IDs for choice exercises)
     * @param {number} userId - The ID of the user submitting the answer
     * @returns {Promise<{id: number; exerciseId: number; userId: number; answerText: string; isCorrect: boolean; feedback?: string; createdAt: Date}>} Promise resolving to the submission record with evaluation results
     * @throws {NotFoundException} if the exercise does not exist
     * @throws {BadRequestException} if the exercise type is not supported
     */
    async submitAnswer(
        id: number,
        answerText: string,
        userId: number,
    ): Promise<{
        id: number;
        exerciseId: number;
        userId: number;
        answerText: string;
        isCorrect: boolean;
        feedback?: string;
        createdAt: Date;
    }> {
        const exercise = await this.getExerciseById(id);
        
        // Unterstützte Aufgabentypen prüfen
        if (exercise.type !== ExerciseType.SINGLE_CHOICE && 
            exercise.type !== ExerciseType.MULTIPLE_CHOICE &&
            exercise.type !== ExerciseType.QUERY) {
            throw new BadRequestException(
                `Exercise type ${exercise.type} wird für Antwortauswertung nicht unterstützt. Unterstützte Typen: Single-Choice, Multiple-Choice, Query.`
            );
        }let isCorrect = false;
        let feedback = '';        // Antwort je nach Aufgabentyp evaluieren
        if (exercise.type === ExerciseType.QUERY && exercise.querySolution) {
            try {
                // Automatische SQL-Bewertung
                const evaluation = await this.sqlEvaluationService.evaluateQuery(
                    answerText,
                    exercise.querySolution,
                    exercise.databaseId!
                );
                
                isCorrect = evaluation.isCorrect;
                feedback = evaluation.feedback;
                
            } catch (error) {
                console.error('SQL evaluation failed:', error);
                isCorrect = false;
                feedback = 'Automatische Bewertung fehlgeschlagen. Ein Tutor wird Ihre Lösung prüfen.';
            }
        } else if (exercise.type === ExerciseType.SINGLE_CHOICE) {
            ({ isCorrect, feedback } = this.evaluateSingleChoice(exercise, answerText));
        } else if (exercise.type === ExerciseType.MULTIPLE_CHOICE) {
            ({ isCorrect, feedback } = this.evaluateMultipleChoice(exercise, answerText));
        }

        // Submission in Datenbank erstellen
        const submission = await this.prisma.submission.create({
            data: {
                exerciseId: id,
                userId,
                answerText,
                isCorrect,
                feedback,
            },
        });

        // Progress aktualisieren wenn Antwort richtig ist
        if (isCorrect) {
            try {
                await this.progressService.updateExerciseProgress(userId, id, { 
                    exerciseId: id,
                    isPassed: true 
                });
            } catch (error) {
                // Fehler loggen aber Submission nicht fehlschlagen lassen
                console.error('Fehler beim Aktualisieren des Exercise Progress:', error);
            }
        }

        // Response formatieren (feedback als optional)
        return {
            id: submission.id,
            exerciseId: submission.exerciseId,
            userId: submission.userId,
            answerText: submission.answerText,
            isCorrect: submission.isCorrect,
            feedback: submission.feedback || undefined,
            createdAt: submission.createdAt,
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
