import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTopicDto } from '../models/create-topic.dto';
import { UpdateTopicDto } from '../models/update-topic.dto';
import { ReorderTopicsDto } from '../models/reorder-topics.dto';
import { ChaptersService } from '../../chapters/services/chapters.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { Topic } from '@prisma/client';

@Injectable()
export class TopicsService {
    constructor(
        private prisma: PrismaService,
        private readonly chaptersService: ChaptersService
    ) {}

    async getTopics(chapterId: number): Promise<Topic[]> {
        // Verify chapter exists
        await this.chaptersService.getChapterById(chapterId);

        return this.prisma.topic.findMany({
            where: { chapterId },
            include: {
                exercises: {
                    include: {
                        database: true,
                        answers: true
                    }
                }
            },
            orderBy: { order: 'asc' }
        });
    }

    async getTopicById(id: number): Promise<Topic> {
        const topic = await this.prisma.topic.findUnique({
            where: { id },
            include: {
                exercises: {
                    include: {
                        database: true,
                        answers: true
                    }
                }
            }
        });

        if (!topic) {
            throw new NotFoundException(`Topic with ID "${id}" not found`);
        }

        return topic;
    }

    async createTopic(createTopicDto: CreateTopicDto): Promise<number> {
        // Verify chapter exists    
        await this.chaptersService.getChapterById(createTopicDto.chapterId);

        if (!createTopicDto.order) {
            const lastTopic = await this.prisma.topic.findFirst({
                where: { chapterId: createTopicDto.chapterId },
                orderBy: { order: 'desc' },
                take: 1
            });
            createTopicDto.order = lastTopic ? lastTopic.order + 1 : 0;
        }

        const topic = await this.prisma.topic.create({
            data: createTopicDto
        });
        return topic.id;
    }

    async updateTopic(id: number, updateTopicDto: UpdateTopicDto): Promise<Topic> {
        const topic = await this.getTopicById(id);
        Object.assign(topic, updateTopicDto);
        return this.prisma.topic.update({
            where: { id },
            data: updateTopicDto,
            include: {
                exercises: {
                    include: {
                        database: true,
                        answers: true
                    }
                }
            }
        });
    }

    async removeTopic(id: number): Promise<void> {
        const topic = await this.getTopicById(id);
        await this.prisma.topic.delete({
            where: { id }
        });
    }

    async reorderTopics(chapterId: number, reorderTopicsDto: ReorderTopicsDto): Promise<void> {
        const { topics: reorderedTopics } = reorderTopicsDto;

        // Get current topics to verify they belong to the chapter
        const currentTopics = await this.prisma.topic.findMany({
            where: { chapterId },
            select: { id: true }
        });

        const currentIds = new Set(currentTopics.map(t => t.id));
        
        // Verify all topics belong to the chapter
        if (!reorderedTopics.every(t => currentIds.has(Number(t.id)))) {
            throw new NotFoundException('One or more topics not found in this chapter');
        }

        // Update all topics in a single transaction
        await this.prisma.$transaction(async (tx) => {
            // First, set all topics to a temporary negative order to avoid unique constraint conflicts
            await tx.topic.updateMany({
                where: { chapterId },
                data: { order: -1 }
            });

            // Then update each topic with its new order
            for (const [index, topic] of reorderedTopics.entries()) {
                await tx.topic.update({
                    where: { id: Number(topic.id) },
                    data: { order: index }
                });
            }
        });
    }
} 