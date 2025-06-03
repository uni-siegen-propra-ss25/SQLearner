import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TopicsService } from '../services/topics.service';
import { Topic } from '@prisma/client';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/role.decorator';
import { CreateTopicDto } from '../models/create-topic.dto';
import { UpdateTopicDto } from '../models/update-topic.dto';

/**
 * Controller managing topic-related operations within chapters.
 * Handles CRUD operations for topics and their ordering within chapters.
 * Topics are organizational units that contain exercises and serve as
 * learning units within the chapter structure.
 *
 * Protected by role-based access control for modifications.
 *
 * @class TopicsController
 */
@ApiTags('Topics')
@Controller('chapters/:chapterId/topics')
export class TopicsController {
    constructor(private readonly topicsService: TopicsService) {}

    /**
     * Retrieves all topics for a specific chapter.
     *
     * @param chapterId - The ID of the chapter whose topics to retrieve
     * @returns Promise resolving to an array of Topic objects
     * @throws NotFoundException if the chapter does not exist
     */
    @Get()
    @ApiOperation({ summary: 'Get all topics in a chapter' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiResponse({ status: 200, description: 'List of all topics in the chapter' })
    async getTopics(@Param('chapterId') chapterId: number): Promise<Topic[]> {
        const topics = await this.topicsService.getTopics(chapterId);
        return topics;
    }

    /**
     * Retrieves a specific topic by ID.
     *
     * @param chapterId - The ID of the chapter containing the topic
     * @param id - The ID of the topic to retrieve
     * @returns Promise resolving to a Topic object
     * @throws NotFoundException if the topic does not exist
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get a topic by ID' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiParam({ name: 'id', description: 'Topic ID' })
    @ApiResponse({ status: 200, description: 'The found topic' })
    @ApiResponse({ status: 404, description: 'Topic not found' })
    async getTopicById(
        @Param('chapterId') chapterId: number,
        @Param('id') id: number,
    ): Promise<Topic> {
        const topic = await this.topicsService.getTopicById(id);
        if (!topic) {
            throw new NotFoundException('Topic not found');
        }
        return topic;
    }

    /**
     * Creates a new topic in a chapter.
     *
     * @param chapterId - The ID of the chapter to create the topic in
     * @param createTopicDto - The data for creating the new topic
     * @returns Promise resolving to the ID of the created topic
     * @throws NotFoundException if the chapter does not exist
     */
    @Post()
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new topic' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiResponse({ status: 201, description: 'The topic has been created' })
    async createTopic(
        @Param('chapterId') chapterId: number,
        @Body() createTopicDto: CreateTopicDto,
    ): Promise<number> {
        createTopicDto.chapterId = chapterId;
        const topicId = await this.topicsService.createTopic(createTopicDto);
        return topicId;
    }

    /**
     * Updates an existing topic.
     *
     * @param chapterId - The ID of the chapter containing the topic
     * @param id - The ID of the topic to update
     * @param updateTopicDto - The data to update the topic with
     * @returns Promise resolving to the updated Topic object
     * @throws NotFoundException if the topic does not exist
     */
    @Put(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @ApiOperation({ summary: 'Update a topic' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiParam({ name: 'id', description: 'Topic ID' })
    @ApiResponse({ status: 200, description: 'The topic has been updated' })
    async updateTopic(
        @Param('chapterId') chapterId: number,
        @Param('id') id: number,
        @Body() updateTopicDto: UpdateTopicDto,
    ): Promise<Topic> {
        updateTopicDto.chapterId = chapterId;
        const topic = await this.topicsService.updateTopic(id, updateTopicDto);
        return topic;
    }

    /**
     * Removes a topic and all its associated exercises.
     *
     * @param chapterId - The ID of the chapter containing the topic
     * @param id - The ID of the topic to remove
     * @throws NotFoundException if the topic does not exist
     */
    @Delete(':id')
    @Roles(Role.TUTOR, Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a topic' })
    @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
    @ApiParam({ name: 'id', description: 'Topic ID' })
    @ApiResponse({ status: 204, description: 'The topic has been deleted' })
    async removeTopic(
        @Param('chapterId') chapterId: number,
        @Param('id') id: number,
    ): Promise<void> {
        await this.topicsService.removeTopic(id);
        return;
    }
}
