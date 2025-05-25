import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateChapterDto } from '../models/create-chapter.dto';
import { UpdateChapterDto } from '../models/update-chapter.dto';
import { ReorderChaptersDto } from '../models/reorder-chapters.dto';
import { Chapter } from '@prisma/client';

@Injectable()
export class ChaptersService {
  constructor(private readonly prisma: PrismaService) {}

  async getChapters(): Promise<Chapter[]> {
    return this.prisma.chapter.findMany({
      include: {
        topics: {
          include: {
            exercises: {
              include: {
                database: true,
                answers: true
              }
            }
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });
  }

  async getChapterById(id: number): Promise<Chapter> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        topics: {
          include: {
            exercises: {
              include: {
                database: true,
                answers: true
              }
            }
          }
        }
      }
    });
    if (!chapter) {
      throw new NotFoundException('Chapter not found');
    }
    return chapter;
  }

  async createChapter(createChapterDto: CreateChapterDto): Promise<number> {
    const chapter = await this.prisma.chapter.create({
      data: createChapterDto,
      include: {
        topics: {
          include: {
            exercises: {
              include: {
                database: true,
                answers: true
              }
            }
          }
        }
      } 
    });
    return chapter.id;
  }

  async updateChapter(id: number, updateChapterDto: UpdateChapterDto): Promise<Chapter> {
    return this.prisma.chapter.update({
      where: { id },
      data: updateChapterDto,
      include: {
        topics: {
          include: {
            exercises: {
              include: {
                database: true,
                answers: true
              }
            }
          }
        }
      }
    });
  }

  async deleteChapter(id: number): Promise<void> {
    // First delete all related topics and exercises
    await this.prisma.exercise.deleteMany({
      where: {
        topic: {
          chapterId: id
        }
      }
    });

    await this.prisma.topic.deleteMany({
      where: {
        chapterId: id
      }
    });

    await this.prisma.chapter.delete({
      where: { id }
    });
  }

  async reorderChapters(reorderChaptersDto: ReorderChaptersDto): Promise<void> {
    const { chapters: reorderedChapters } = reorderChaptersDto;
    
    // Get current chapters to verify they exist
    const currentChapters = await this.prisma.chapter.findMany({
      select: { id: true }
    });

    const currentIds = new Set(currentChapters.map(c => c.id));
    
    // Verify all chapters exist
    if (!reorderedChapters.every(c => currentIds.has(c.id))) {
      throw new NotFoundException('One or more chapters not found');
    }

    // Update all chapters in a single transaction
    await this.prisma.$transaction(async (tx) => {
      // First, set all chapters to a temporary negative order to avoid unique constraint conflicts
      await tx.chapter.updateMany({
        data: { order: -1 }
      });

      // Then update each chapter with its new order
      for (const [index, chapter] of reorderedChapters.entries()) {
        await tx.chapter.update({
          where: { id: Number(chapter.id) },
          data: { order: index }
        });
      }
    });
  }
} 