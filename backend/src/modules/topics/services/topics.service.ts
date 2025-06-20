import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTopicDto } from '../models/create-topic.dto';
import { UpdateTopicDto } from '../models/update-topic.dto';
import { ChaptersService } from '../../chapters/services/chapters.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Topic } from '@prisma/client';

/**
 * Service handling business logic for topic-related operations.
 * Manages the creation, retrieval, update, and deletion of topics,
 * as well as their ordering within chapters.
 */
@Injectable()
export class TopicsService {
    constructor(
        private prisma: PrismaService,
        private readonly chaptersService: ChaptersService,
    ) {}

    /**
     * Retrieves all topics within a chapter.
     *
     * @param chapterId - The ID of the chapter whose topics to retrieve
     * @returns Promise resolving to an array of Topic objects with their exercises
     * @throws NotFoundException if the chapter does not exist
     */
    async getTopics(chapterId: number): Promise<Topic[]> {
        // Verify chapter exists
        await this.chaptersService.getChapterById(Number(chapterId));

        return this.prisma.topic.findMany({
            where: { chapterId: Number(chapterId) },
            include: {
                exercises: {
                    include: {
                        database: true,
                        answers: true,
                    },
                },
            },
            orderBy: { order: 'asc' },
        });
    }

    /**
     * Retrieves a specific topic by ID.
     *
     * @param id - The ID of the topic to retrieve
     * @returns Promise resolving to the Topic object with its exercises
     * @throws NotFoundException if the topic does not exist
     */
    async getTopicById(id: number): Promise<Topic> {
        const topic = await this.prisma.topic.findUnique({
            where: { id: Number(id) },
            include: {
                exercises: {
                    include: {
                        database: true,
                        answers: true,
                    },
                },
            },
        });

        if (!topic) {
            throw new NotFoundException(`Topic with ID "${id}" not found`);
        }

        return topic;
    }

    /**
     * Creates a new topic in a chapter.
     *
     * @param createTopicDto - The data for creating the new topic
     * @returns Promise resolving to the ID of the created topic
     * @throws NotFoundException if the chapter does not exist
     */
    async createTopic(createTopicDto: CreateTopicDto): Promise<number> {
        // Verify chapter exists
        await this.chaptersService.getChapterById(createTopicDto.chapterId);

        if (!createTopicDto.order) {
            const lastTopic = await this.prisma.topic.findFirst({
                where: { chapterId: createTopicDto.chapterId },
                orderBy: { order: 'desc' },
                take: 1,
            });
            createTopicDto.order = lastTopic ? lastTopic.order + 1 : 0;
        }

        const topic = await this.prisma.topic.create({
            data: createTopicDto,
        });
        return topic.id;
    }

    /**
     * Updates an existing topic.
     *
     * @param id - The ID of the topic to update
     * @param updateTopicDto - The data to update the topic with
     * @returns Promise resolving to the updated Topic object
     * @throws NotFoundException if the topic does not exist
     */
    async updateTopic(id: number, updateTopicDto: UpdateTopicDto): Promise<Topic> {
        const topic = await this.getTopicById(Number(id));
        Object.assign(topic, updateTopicDto);
        return this.prisma.topic.update({
            where: { id: Number(id) },
            data: updateTopicDto,
            include: {
                exercises: {
                    include: {
                        database: true,
                        answers: true,
                    },
                },
            },
        });
    }

    /**
     * Removes a topic and its associated exercises.
     *
     * @param id - The ID of the topic to remove
     * @throws NotFoundException if the topic does not exist
     */
    async removeTopic(id: number): Promise<void> {
        const topic = await this.getTopicById(Number(id));
        await this.prisma.topic.delete({
            where: { id: Number(id) },
        });
    }
}
