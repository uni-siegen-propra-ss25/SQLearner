import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TopicsService } from '../services/topics.service';
import { Topic } from '@prisma/client';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';
import { CreateTopicDto } from '../models/create-topic.dto';
import { ReorderTopicsDto } from '../models/reorder-topics.dto';
import { UpdateTopicDto } from '../models/update-topic.dto';

@ApiTags('Topics')
@Controller('chapters/:chapterId/topics')
export class TopicsController {
    constructor(private readonly topicsService: TopicsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all topics in a chapter' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiResponse({ status: 200, description: 'List of all topics in the chapter' })
    async getTopics(@Param('chapterId') chapterId: number): Promise<Topic[]> {
        const topics = await this.topicsService.getTopics(chapterId);
        return topics;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a topic by ID' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiParam({ name: 'id', description: 'Topic ID' })
    @ApiResponse({ status: 200, description: 'The found topic' })
    @ApiResponse({ status: 404, description: 'Topic not found' })
    async getTopicById(
        @Param('chapterId') chapterId: number,
        @Param('id') id: number
    ): Promise<Topic> {
        const topic = await this.topicsService.getTopicById(id);
        if (!topic) {
            throw new NotFoundException('Topic not found');
        }
        return topic;
    }

    @Post()
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new topic' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiResponse({ status: 201, description: 'The topic has been created' })
    async createTopic(
        @Param('chapterId') chapterId: number,
        @Body() createTopicDto: CreateTopicDto
    ): Promise<number> {
        createTopicDto.chapterId = chapterId;
        const topicId = await this.topicsService.createTopic(createTopicDto);
        return topicId;
    }

    @Put(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @ApiOperation({ summary: 'Update a topic' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiParam({ name: 'id', description: 'Topic ID' })
    @ApiResponse({ status: 200, description: 'The topic has been updated' })
    @ApiResponse({ status: 404, description: 'Topic not found' })
    async updateTopic(
        @Param('chapterId') chapterId: number,
        @Param('id') id: number,
        @Body() updateTopicDto: UpdateTopicDto
    ): Promise<Topic> {
        updateTopicDto.chapterId = chapterId;
        const topic = await this.topicsService.updateTopic( id, updateTopicDto);
        return topic;
    }       

    @Delete(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a topic' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiParam({ name: 'id', description: 'Topic ID' })
    @ApiResponse({ status: 204, description: 'The topic has been deleted' })
    @ApiResponse({ status: 404, description: 'Topic not found' })
    async removeTopic(
        @Param('chapterId') chapterId: number,
        @Param('id') id: number
    ): Promise<void> {
        await this.topicsService.removeTopic(id);
        return;
    }

    @Put('reorder')
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Reorder topics within a chapter' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiResponse({ status: 204, description: 'Topics have been reordered' })
    async reorderTopics(
        @Param('chapterId') chapterId: number,
        @Body() reorderTopicsDto: ReorderTopicsDto
    ): Promise<void> {
        await this.topicsService.reorderTopics(chapterId, reorderTopicsDto);
        return;
    }
}