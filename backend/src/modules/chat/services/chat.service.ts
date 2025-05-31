import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Message, MessageDto } from '../models/chat.model';
import { Prisma } from '@prisma/client';

/**
 * Service handling chat-related functionality and AI interactions.
 * Manages message storage, retrieval, and AI response generation.
 */
@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) {}

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
    }

    /**
     * Internal method to generate an AI response using a language model.
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
        // TODO: Implement actual LLM integration with OpenAI or similar service
        return `I understand your question about SQL. Let me help you with: "${userMessage}"`;
    }
}
