import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { MessageDto } from '../models/chat.model';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth/jwt-auth.guard';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private chatService: ChatService) {}

    @Post()
    @ApiOperation({ summary: 'Send a message to the AI assistant' })
    async sendMessage(
        @GetUser('id') userId: number,
        @Body() message: MessageDto
    ) {
        return this.chatService.sendMessage(userId, message);
    }

    @Get()
    @ApiOperation({ summary: 'Get chat messages for a context' })
    async getMessages(
        @GetUser('id') userId: number,
        @Query('context') context?: string
    ) {
        return this.chatService.getMessages(userId, context);
    }
}
