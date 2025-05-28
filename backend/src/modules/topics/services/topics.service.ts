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
        private readonly chaptersService: ChaptersService,
    ) {}

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

    async removeTopic(id: number): Promise<void> {
        const topic = await this.getTopicById(Number(id));
        await this.prisma.topic.delete({
            where: { id: Number(id) },
        });
    }

    async reorderTopics(chapterId: number, reorderTopicsDto: ReorderTopicsDto): Promise<void> {
        const { topics: reorderedTopics } = reorderTopicsDto;

        const currentTopics = await this.prisma.topic.findMany({
            where: { chapterId: Number(chapterId) },
            select: { id: true },
        });

        const currentIds = new Set(currentTopics.map((t) => t.id));

        if (!reorderedTopics.every((t) => currentIds.has(Number(t.id)))) {
            throw new NotFoundException('One or more topics not found in this chapter');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.topic.updateMany({
                where: { chapterId: Number(chapterId) },
                data: { order: -1 },
            });

            for (const topic of reorderedTopics) {
                await tx.topic.update({
                    where: { id: Number(topic.id) },
                    data: { order: Number(topic.order) },
                });
            }
        });
    }
}
