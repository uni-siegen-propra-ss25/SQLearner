import { Module } from '@nestjs/common';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Chat Module provides AI-assisted learning support through chat functionality.
 *
 * This module manages the chat interface between users and an AI assistant,
 * allowing students to ask questions and receive help with SQL queries.
 * It stores chat history and manages contextual conversations related to
 * specific exercises or learning topics.
 *
 * @module ChatModule
 */
@Module({
    imports: [PrismaModule],
    controllers: [ChatController],
    providers: [ChatService],
    exports: [ChatService],
})
export class ChatModule {}
