import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Message, MessageDto } from '../models/chat.model';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
    constructor(
        private prisma: PrismaService,
    ) {}

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
                    replyTo: true
                }
            });

            // TODO: Implement actual LLM integration
            const llmResponse = await this.generateLLMResponse(message.content, message.context || null);

            // Save assistant's response
            const assistantMessage = await this.prisma.chatMessage.create({
                data: {
                    content: llmResponse,
                    userId,
                    sender: 'assistant',
                    context: message.context || null,
                    replyToId: userMessage.id
                },
                include: {
                    replyTo: true
                }
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

    async getMessages(userId: number, context?: string): Promise<Message[]> {
        try {
            return await this.prisma.chatMessage.findMany({
                where: {
                    userId,
                    context: context || null
                },
                orderBy: {
                    createdAt: 'asc'
                },
                include: {
                    replyTo: true
                }
            });
        } catch (error) {
            console.error('Error in getMessages:', error);
            throw new InternalServerErrorException('Failed to fetch messages');
        }
    }

    private async generateLLMResponse(userMessage: string, context: string | null): Promise<string> {
        // TODO: Implement actual LLM integration with OpenAI or similar service
        return `I understand your question about SQL. Let me help you with: "${userMessage}"`;
    }
}
