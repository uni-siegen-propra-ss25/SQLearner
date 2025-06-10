import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Message, MessageDto } from '../models/chat.model';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';

/**
 * Service handling chat-related functionality and AI interactions.
 * Manages message storage, retrieval, and AI response generation.
 */
@Injectable()
export class ChatService {
    private openai: OpenAI;

    constructor(private prisma: PrismaService) {
        this.initializeOpenAI();
    }

    /**
     * Processes and stores a user message, generating an AI response.
     * Creates both the user message and AI response in the database.
     *
     * @param userId - The ID of the user sending the message
     * @param message - The message data containing content and context
     * @returns Promise resolving to the AI response message
     * @throws BadRequestException if message data is invalid
     * @throws InternalServerErrorException if message processing fails
     */
    async sendMessage(userId: number, message: MessageDto): Promise<Message> {
        if (!message.content?.trim()) {
            throw new BadRequestException('Message content cannot be empty');
        }

        try {
            // Save user message
            const userMessage = await this.prisma.chatMessage.create({
                data: {
                    content: message.content.trim(),
                    userId,
                    sender: 'user',
                    context: message.context || null,
                },
                include: {
                    replyTo: true,
                },
            });

            // TODO: Implement actual LLM integration
            const llmResponse = await this.generateLLMResponse(
                message.content,
                message.context || null,
            );

            // Save assistant's response
            const assistantMessage = await this.prisma.chatMessage.create({
                data: {
                    content: llmResponse,
                    userId,
                    sender: 'assistant',
                    context: message.context || null,
                    replyToId: userMessage.id,
                },
                include: {
                    replyTo: true,
                },
            });

            return assistantMessage;
        } catch (error) {
            console.error('Error in sendMessage:', error);
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                throw new BadRequestException('Invalid message data');
            }
            throw new InternalServerErrorException('Failed to process message');
        }
    }

    /**
     * Retrieves all chat messages for a specific user and context.
     *
     * @param userId - The ID of the user whose messages to retrieve
     * @param context - Optional context to filter messages by
     * @returns Promise resolving to an array of Message objects
     */
    async getMessages(userId: number, context?: string): Promise<Message[]> {
        try {
            return await this.prisma.chatMessage.findMany({
                where: {
                    userId,
                    context: context || null,
                },
                orderBy: {
                    createdAt: 'asc',
                },
                include: {
                    replyTo: true,
                },
            });
        } catch (error) {
            console.error('Error in getMessages:', error);
            throw new InternalServerErrorException('Failed to fetch messages');
        }
    }    /**
     * Internal method to generate an AI response using OpenAI.
     *
     * @param userMessage - The user's message content
     * @param context - Optional context for the conversation
     * @returns Promise resolving to the generated AI response
     * @private
     */
    private async generateLLMResponse(
        userMessage: string,
        context: string | null,
    ): Promise<string> {
        try {
            // Ensure OpenAI is initialized
            const isInitialized = await this.initializeOpenAI();
            if (!isInitialized) {
                return "⚠️ KI-Chat ist derzeit nicht verfügbar. Bitte konfigurieren Sie den OpenAI API-Key in den Einstellungen.";
            }

            const systemPrompt = this.buildSystemPrompt(context);
            
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            });

            return completion.choices[0]?.message?.content || "Entschuldigung, ich konnte keine Antwort generieren.";
        } catch (error) {
            console.error('Error generating LLM response:', error);
            return "Entschuldigung, es gab einen Fehler beim Generieren der Antwort. Bitte versuchen Sie es später erneut.";
        }
    }

    /**
     * Builds the system prompt based on the conversation context.
     *
     * @param context - The context of the conversation
     * @returns The system prompt string
     * @private
     */
    private buildSystemPrompt(context: string | null): string {
        const basePrompt = `Du bist ein hilfsreicher SQL-Tutor für eine Lernplattform. Deine Aufgabe ist es, Studenten beim Lernen von SQL zu helfen. 
        
Antworte immer auf Deutsch und sei geduldig und ermutigend. Erkläre Konzepte klar und verständlich.`;

        if (context === 'sql_feedback') {
            return `${basePrompt}
            
Du bewertest SQL-Queries von Studenten. Analysiere die Query und gib konstruktives Feedback:
- Ist die Query syntaktisch korrekt?
- Löst sie das gestellte Problem?
- Gibt es Verbesserungsmöglichkeiten?
- Erkläre eventuelle Fehler und wie man sie behebt
- Gib konkrete Tipps für bessere SQL-Praktiken

Dein Feedback sollte lehrreich und motivierend sein.`;
        }

        return basePrompt;
    }    /**
     * Provides AI-powered feedback for SQL queries submitted by students.
     * Compares the student's query with the expected solution and provides detailed feedback.
     *
     * @param userId - The ID of the user submitting the query
     * @param exerciseId - The ID of the exercise
     * @param studentQuery - The SQL query submitted by the student
     * @returns Promise resolving to the AI feedback message
     */
    async provideSqlQueryFeedback(
        userId: number,
        exerciseId: number,
        studentQuery: string,
    ): Promise<Message> {
        try {
            // Get exercise details including expected solution
            const exercise = await this.prisma.exercise.findUnique({
                where: { id: exerciseId },
                include: {
                    database: true,
                },
            });

            if (!exercise) {
                throw new BadRequestException('Exercise not found');
            }            // Create a context-rich message for SQL feedback
            const feedbackContext = this.buildSqlFeedbackContext(
                studentQuery,
                exercise.querySolution || undefined,
                exercise.description,
            );

            // Save the student's query as user message
            const userMessage = await this.prisma.chatMessage.create({
                data: {
                    content: `SQL Query: ${studentQuery}`,
                    userId,
                    sender: 'user',
                    context: 'sql_feedback',
                    // exerciseId, // TODO: Add after Prisma client update
                },
            });

            // Generate AI feedback
            const aiResponse = await this.generateSqlFeedback(feedbackContext);

            // Save the AI feedback
            const assistantMessage = await this.prisma.chatMessage.create({
                data: {
                    content: aiResponse,
                    userId,
                    sender: 'assistant',
                    context: 'sql_feedback',
                    // exerciseId, // TODO: Add after Prisma client update
                    replyToId: userMessage.id,
                },
                include: {
                    replyTo: true,
                },
            });

            return assistantMessage;
        } catch (error) {
            console.error('Error in provideSqlQueryFeedback:', error);
            throw new InternalServerErrorException('Failed to generate SQL feedback');
        }
    }

    /**
     * Builds a comprehensive context for SQL feedback generation.
     *
     * @param studentQuery - The student's SQL query
     * @param expectedSolution - The expected solution
     * @param exerciseDescription - Description of the exercise
     * @returns The context string for AI feedback
     * @private
     */
    private buildSqlFeedbackContext(
        studentQuery: string,
        expectedSolution?: string,
        exerciseDescription?: string,
    ): string {
        let context = `Student's SQL Query:\n${studentQuery}\n\n`;

        if (exerciseDescription) {
            context += `Exercise Description:\n${exerciseDescription}\n\n`;
        }

        if (expectedSolution) {
            context += `Expected Solution:\n${expectedSolution}\n\n`;
        }

        context += `Please provide detailed feedback on the student's SQL query.`;

        return context;
    }    /**
     * Generates AI feedback specifically for SQL queries.
     *
     * @param context - The context containing student query and exercise details
     * @returns Promise resolving to the AI feedback
     * @private
     */
    private async generateSqlFeedback(context: string): Promise<string> {
        try {
            // Ensure OpenAI is initialized
            const isInitialized = await this.initializeOpenAI();
            if (!isInitialized) {
                return "⚠️ KI-Feedback ist derzeit nicht verfügbar. Bitte konfigurieren Sie den OpenAI API-Key in den Einstellungen.";
            }

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

            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: context }
                ],
                max_tokens: 1500,
                temperature: 0.3, // Lower temperature for more consistent technical feedback
            });

            return completion.choices[0]?.message?.content || "Entschuldigung, ich konnte kein Feedback generieren.";
        } catch (error) {
            console.error('Error generating SQL feedback:', error);
            return "Entschuldigung, es gab einen Fehler beim Generieren des SQL-Feedbacks. Bitte versuchen Sie es später erneut.";
        }
    }

    /**
     * Gets the OpenAI API key from environment variables or settings.
     * Checks first for environment variable, then falls back to settings.
     * 
     * @returns Promise resolving to the API key or null if not found
     * @private
     */
    private async getApiKey(): Promise<string | null> {
        // First try environment variable
        if (process.env.OPENAI_API_KEY) {
            return process.env.OPENAI_API_KEY;
        }

        // Fallback to settings
        try {
            const setting = await this.prisma.settings.findUnique({
                where: { name: 'OPENAI_API_KEY' },
            });
            return setting?.value || null;
        } catch (error) {
            console.error('Error retrieving OpenAI API key from settings:', error);
            return null;
        }
    }

    /**
     * Initializes OpenAI client with current API key.
     * 
     * @returns Promise resolving to true if successful, false otherwise
     * @private
     */
    private async initializeOpenAI(): Promise<boolean> {
        const apiKey = await this.getApiKey();
        
        if (!apiKey) {
            console.warn('OpenAI API key not found. Please configure it in settings or environment variables.');
            return false;
        }

        this.openai = new OpenAI({
            apiKey: apiKey,
        });

        return true;
    }
}
