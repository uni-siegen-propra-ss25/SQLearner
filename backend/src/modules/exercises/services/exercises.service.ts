import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateExerciseDto, AnswerOptionDto } from '../models/create-exercise.dto';
import { UpdateExerciseDto } from '../models/update-exercise.dto';
import { Exercise, ExerciseType } from '@prisma/client';
import { DatabasesService } from '../../databases/services/databases.service';
import { ProgressService } from '../../progress/services/progress.service';
import OpenAI from 'openai';

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
     */
    constructor(
        private readonly prisma: PrismaService,
        private readonly databasesService: DatabasesService,
        private readonly progressService: ProgressService,
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
        
        return this.databasesService.runQuery(exercise.database.id, query);
    }

    /**
     * Submits an answer for Single Choice and Multiple Choice exercises.
     * Evaluates the answer for correctness and saves progress to database.
     * Provides instant feedback with German messages and updates user progress for correct answers.
     *
     * @param {number} id - The ID of the exercise to submit an answer for
     * @param {string} answerText - The answer text (selected option IDs for choice exercises)
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
          // Nur Single Choice, Multiple Choice und Query Aufgaben behandeln
        if (exercise.type !== ExerciseType.SINGLE_CHOICE && 
            exercise.type !== ExerciseType.MULTIPLE_CHOICE &&
            exercise.type !== ExerciseType.QUERY) {
            throw new BadRequestException(
                `Exercise type ${exercise.type} wird für Antwortauswertung nicht unterstützt. Nur Single-Choice, Multiple-Choice und Query Aufgaben werden behandelt.`
            );
        }

        let isCorrect = false;
        let feedback = '';        // Antwort je nach Aufgabentyp evaluieren
        if (exercise.type === ExerciseType.SINGLE_CHOICE) {
            ({ isCorrect, feedback } = this.evaluateSingleChoice(exercise, answerText));
        } else if (exercise.type === ExerciseType.MULTIPLE_CHOICE) {
            ({ isCorrect, feedback } = this.evaluateMultipleChoice(exercise, answerText));
        } else if (exercise.type === ExerciseType.QUERY) {
            ({ isCorrect, feedback } = await this.evaluateSqlQuery(exercise, answerText, userId));
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

    /**
     * Evaluiert eine SQL Query Aufgabe durch Vergleich mit der Musterlösung.
     * Nutzt KI-basiertes Feedback für detaillierte Bewertung der Studentenantwort.
     *
     * @param {any} exercise - Die Aufgabe mit SQL-Lösung und Datenbankkontext
     * @param {string} answerText - Die SQL Query des Studenten
     * @param {number} userId - ID des Studenten für Chat-Feedback
     * @returns {Promise<{isCorrect: boolean; feedback: string}>} Evaluierungsergebnis mit Korrektheit und Feedback
     * @private
     */
    private async evaluateSqlQuery(
        exercise: any,
        answerText: string,
        userId: number,
    ): Promise<{ isCorrect: boolean; feedback: string }> {
        try {
            // Validierung der SQL Query
            if (!answerText || !answerText.trim()) {
                return {
                    isCorrect: false,
                    feedback: 'Bitte geben Sie eine SQL Query ein.',
                };
            }

            // Überprüfen ob eine Musterlösung vorhanden ist
            if (!exercise.querySolution) {
                return {
                    isCorrect: false,
                    feedback: 'Für diese Aufgabe ist keine Musterlösung verfügbar. Bitte wenden Sie sich an Ihren Tutor.',
                };
            }

            let isCorrect = false;
            let feedback = '';

            try {
                // Ausführung der Student-Query
                const studentResult = await this.databasesService.runQuery(exercise.database.id, answerText);
                
                // Ausführung der Musterlösung
                const solutionResult = await this.databasesService.runQuery(exercise.database.id, exercise.querySolution);

                // Vergleich der Ergebnisse
                isCorrect = this.compareQueryResults(studentResult, solutionResult);

                if (isCorrect) {
                    feedback = '✅ Perfekt! Ihre SQL Query liefert das korrekte Ergebnis.';
                } else {
                    feedback = '❌ Das Ergebnis Ihrer Query unterscheidet sich von der erwarteten Lösung. Überprüfen Sie Ihre SQL-Syntax und Logik.';
                }

            } catch (error) {
                // SQL Fehler in der Student-Query
                isCorrect = false;
                feedback = `❌ SQL Fehler: ${error.message || 'Ungültige SQL Query'}. Bitte überprüfen Sie Ihre Syntax.`;
            }

            return { isCorrect, feedback };

        } catch (error) {
            console.error('Error in evaluateSqlQuery:', error);
            return {
                isCorrect: false,
                feedback: 'Fehler bei der Auswertung der SQL Query. Bitte versuchen Sie es erneut.',
            };
        }
    }

    /**
     * Vergleicht zwei Query-Ergebnisse auf Gleichheit.
     * Prüft sowohl die Spaltennamen als auch die Datenzeilen.
     *
     * @param {any} result1 - Erstes Query-Ergebnis
     * @param {any} result2 - Zweites Query-Ergebnis
     * @returns {boolean} True wenn die Ergebnisse identisch sind
     * @private
     */
    private compareQueryResults(result1: any, result2: any): boolean {
        try {
            // Vergleich der Spaltenanzahl
            if (result1.columns.length !== result2.columns.length) {
                return false;
            }

            // Vergleich der Spaltennamen (reihenfolgenunabhängig)
            const cols1 = result1.columns.sort();
            const cols2 = result2.columns.sort();
            if (JSON.stringify(cols1) !== JSON.stringify(cols2)) {
                return false;
            }

            // Vergleich der Zeilenzahl
            if (result1.rows.length !== result2.rows.length) {
                return false;
            }

            // Sortierung der Zeilen für konsistenten Vergleich
            const sortedRows1 = this.sortRowsForComparison(result1.rows, result1.columns);
            const sortedRows2 = this.sortRowsForComparison(result2.rows, result2.columns);

            // Vergleich der Zeileninhalte
            return JSON.stringify(sortedRows1) === JSON.stringify(sortedRows2);

        } catch (error) {
            console.error('Error comparing query results:', error);
            return false;
        }
    }

    /**
     * Sortiert Tabellenzeilen für konsistenten Vergleich.
     *
     * @param {any[]} rows - Die zu sortierenden Zeilen
     * @param {string[]} columns - Die Spaltennamen
     * @returns {any[]} Sortierte Zeilen
     * @private
     */
    private sortRowsForComparison(rows: any[], columns: string[]): any[] {
        return rows.sort((a, b) => {
            for (const col of columns) {
                const valueA = a[col];
                const valueB = b[col];
                
                if (valueA < valueB) return -1;
                if (valueA > valueB) return 1;
            }
            return 0;
        });
    }

    /**
     * Provides AI-powered feedback for SQL queries submitted by students.
     * Integrates with the chat system to generate contextual feedback.
     *
     * @param {number} exerciseId - The ID of the exercise
     * @param {string} query - The SQL query submitted by the student
     * @param {number} userId - The ID of the user submitting the query
     * @returns {Promise<any>} Promise resolving to the AI feedback message
     * @throws {NotFoundException} if the exercise does not exist
     * @throws {BadRequestException} if the exercise is not a SQL query type
     */
    async getSqlQueryFeedback(exerciseId: number, query: string, userId: number): Promise<any> {
        const exercise = await this.getExerciseById(exerciseId);
        
        if (exercise.type !== ExerciseType.QUERY) {
            throw new BadRequestException('This endpoint only supports SQL query exercises');
        }        if (!exercise.databaseId) {
            throw new BadRequestException('Exercise has no associated database');
        }        // Generate AI feedback directly
        const feedback = await this.generateSqlFeedback(exerciseId, query, userId);

        return {
            exerciseId,
            query,
            feedback: feedback,
            isCorrect: false, // This could be enhanced to include correctness evaluation
        };
    }

    /**
     * Generates AI-powered feedback for SQL queries.
     * 
     * @param exerciseId - The ID of the exercise
     * @param query - The SQL query to analyze
     * @param userId - The ID of the user submitting the query
     * @returns Promise resolving to the feedback string
     * @private
     */
    private async generateSqlFeedback(exerciseId: number, query: string, userId: number): Promise<string> {
        try {
            // Get exercise details including expected solution
            const exercise = await this.prisma.exercise.findUnique({
                where: { id: exerciseId },
                include: {
                    database: true,
                },
            });

            if (!exercise) {
                return 'Exercise nicht gefunden.';
            }

            // Get API key from settings
            const apiKeySetting = await this.prisma.settings.findUnique({
                where: { name: 'OPENAI_API_KEY' },
            });

            const apiKey = process.env.OPENAI_API_KEY || apiKeySetting?.value;

            if (!apiKey) {
                return '⚠️ KI-Feedback ist derzeit nicht verfügbar. Bitte konfigurieren Sie den OpenAI API-Key in den Einstellungen.';
            }

            const openai = new OpenAI({
                apiKey: apiKey,
            });

            // Build context for AI
            let context = `Student's SQL Query:\n${query}\n\n`;
            context += `Exercise Description:\n${exercise.description}\n\n`;
            
            if (exercise.querySolution) {
                context += `Expected Solution:\n${exercise.querySolution}\n\n`;
            }
            
            context += 'Please provide detailed feedback on the student\'s SQL query.';

            const systemPrompt = `Du bist ein erfahrener SQL-Tutor und Datenbankexperte. Deine Aufgabe ist es, konstruktives und detailliertes Feedback zu SQL-Queries von Studenten zu geben.

Analysiere die SQL-Query des Studenten basierend auf folgenden Kriterien:

1. **Syntax**: Ist die Query syntaktisch korrekt?
2. **Logik**: Löst die Query das gestellte Problem?
3. **Effizienz**: Kann die Query optimiert werden?
4. **Best Practices**: Folgt die Query SQL-Best-Practices?
5. **Vergleich mit Lösung**: Wie unterscheidet sich die Query von der Musterlösung (falls vorhanden)?

Dein Feedback sollte:
- Konstruktiv und ermutigend sein
- Konkrete Verbesserungsvorschläge enthalten
- Fehler klar erklären
- Alternative Lösungsansätze aufzeigen
- Auf Deutsch verfasst sein

Struktur dein Feedback in folgende Bereiche:
✅ **Positive Aspekte**
⚠️ **Verbesserungsmöglichkeiten**  
🔧 **Konkrete Tipps**
📝 **Zusammenfassung**`;

            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: context }
                ],
                max_tokens: 1500,
                temperature: 0.3,
            });

            return completion.choices[0]?.message?.content || "Entschuldigung, ich konnte kein Feedback generieren.";

        } catch (error) {
            console.error('Error generating SQL feedback:', error);
            return "Entschuldigung, es gab einen Fehler beim Generieren des SQL-Feedbacks. Bitte versuchen Sie es später erneut.";
        }
    }
}
