import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { MessageDto } from '../models/chat.model';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';

/**
 * Controller managing chat interactions with the AI assistant.
 * Handles message sending and retrieval between users and the AI system.
 * Requires JWT authentication for all endpoints.
 *
 * @class ChatController
 */
@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private chatService: ChatService) {}

    /**
     * Processes and sends a user message to the AI assistant.
     *
     * @param userId - The ID of the user sending the message
     * @param message - The message data containing content and context
     * @returns Promise resolving to the created Message object including the AI response
     */
    @Post()
    @ApiOperation({ summary: 'Send a message to the AI assistant' })
    async sendMessage(@GetUser('id') userId: number, @Body() message: MessageDto) {
        return this.chatService.sendMessage(userId, message);
    }

    /**
     * Retrieves chat messages for a specific user and context.
     *
     * @param userId - The ID of the user whose messages to retrieve
     * @param context - Optional context identifier to filter messages
     * @returns Promise resolving to an array of Message objects
     */
    @Get()
    @ApiOperation({ summary: 'Get chat messages for a context' })
    async getMessages(@GetUser('id') userId: number, @Query('context') context?: string) {
        return this.chatService.getMessages(userId, context);
    }

    /**
     * Provides AI-powered feedback for SQL queries submitted by students.
     *
     * @param userId - The ID of the user submitting the query
     * @param feedbackData - The SQL query feedback request data
     * @returns Promise resolving to the AI feedback message
     */
    @Post('sql-feedback')
    @ApiOperation({ summary: 'Get AI feedback for SQL query' })
    async getSqlQueryFeedback(
        @GetUser('id') userId: number, 
        @Body() feedbackData: { exerciseId: number; query: string }
    ) {
        return this.chatService.provideSqlQueryFeedback(
            userId, 
            feedbackData.exerciseId, 
            feedbackData.query
        );
    }
}
