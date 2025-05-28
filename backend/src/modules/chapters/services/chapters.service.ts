import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateChapterDto } from '../models/create-chapter.dto';
import { UpdateChapterDto } from '../models/update-chapter.dto';
import { Chapter } from '@prisma/client';

@Injectable()
export class ChaptersService {
    constructor(private readonly prisma: PrismaService) {}

    async getChapters(): Promise<Chapter[]> {
        return this.prisma.chapter.findMany({
            include: {
                topics: {
                    include: {
                        exercises: true,
                    },
                },
            },
        });
    }

    async getChapterById(id: number): Promise<Chapter> {
        const chapter = await this.prisma.chapter.findUnique({
            where: { id },
            include: {
                topics: {
                    include: {
                        exercises: true,
                    },
                },
            },
        });
        if (!chapter) {
            throw new NotFoundException('Chapter not found');
        }
        return chapter;
    }

    async createChapter(createChapterDto: CreateChapterDto): Promise<number> {
        const chapter = await this.prisma.chapter.create({
            data: createChapterDto,
        });
        return chapter.id;
    }

    async updateChapter(id: number, updateChapterDto: UpdateChapterDto): Promise<Chapter> {
        const chapter = await this.prisma.chapter.update({
            where: { id },
            data: updateChapterDto,
        });
        if (!chapter) {
            throw new NotFoundException('Chapter not found');
        }
        return chapter;
    }

    async deleteChapter(id: number): Promise<void> {
        // First delete all related topics and exercises
        await this.prisma.exercise.deleteMany({
            where: {
                topic: {
                    chapterId: id,
                },
            },
        });

        await this.prisma.topic.deleteMany({
            where: {
                chapterId: id,
            },
        });

        await this.prisma.chapter.delete({
            where: { id },
        });
    }
}
