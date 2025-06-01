import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateChapterDto } from '../models/create-chapter.dto';
import { UpdateChapterDto } from '../models/update-chapter.dto';
import { Chapter } from '@prisma/client';

/**
 * Service handling business logic for chapter-related operations.
 * Manages the creation, update, deletion of chapters and their relationships
 * with topics and exercises.
 */
@Injectable()
export class ChaptersService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Retrieves all chapters from the database.
     * Includes associated topics and their exercises in the result.
     *
     * @returns Promise resolving to an array of Chapter objects
     */
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

    /**
     * Retrieves a specific chapter by ID.
     * Includes associated topics and their exercises in the result.
     *
     * @param id - The ID of the chapter to retrieve
     * @returns Promise resolving to the Chapter object
     * @throws NotFoundException if the chapter does not exist
     */
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

    /**
     * Creates a new chapter.
     *
     * @param createChapterDto - The data for creating the new chapter
     * @returns Promise resolving to the ID of the created chapter
     */
    async createChapter(createChapterDto: CreateChapterDto): Promise<number> {
        const chapter = await this.prisma.chapter.create({
            data: createChapterDto,
        });
        return chapter.id;
    }

    /**
     * Updates an existing chapter.
     *
     * @param id - The ID of the chapter to update
     * @param updateChapterDto - The data to update the chapter with
     * @returns Promise resolving to the updated Chapter object
     * @throws NotFoundException if the chapter does not exist
     */
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

    /**
     * Removes a chapter and all its associated data.
     * This includes all topics and exercises within the chapter.
     * The deletion happens in a specific order to maintain referential integrity.
     *
     * @param id - The ID of the chapter to remove
     */
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
