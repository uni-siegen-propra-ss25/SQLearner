import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateHintDto, UpdateHintDto } from '../dto/hint.dto';
import { HintData } from '../models/hint.model';
import { Role } from '@prisma/client';

@Injectable()
export class HintsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userRole: Role): Promise<HintData[]> {
    return this.prisma.hint.findMany({
      where: {
        isActive: true,
        OR: [
          { targetRole: null }, // Global hints
          { targetRole: userRole }, // Role-specific hints
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForManagement(): Promise<HintData[]> {
    return this.prisma.hint.findMany({
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number): Promise<HintData> {
    const hint = await this.prisma.hint.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!hint) {
      throw new NotFoundException(`Hint with ID ${id} not found`);
    }

    return hint;
  }

  async create(authorId: number, createHintDto: CreateHintDto): Promise<HintData> {
    return this.prisma.hint.create({
      data: {
        ...createHintDto,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async update(id: number, userId: number, updateHintDto: UpdateHintDto): Promise<HintData> {
    const hint = await this.findOne(id);

    // Only author can update their hints
    if (hint.authorId !== userId) {
      throw new ForbiddenException('You can only update your own hints');
    }

    return this.prisma.hint.update({
      where: { id },
      data: updateHintDto,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    const hint = await this.findOne(id);

    // Only author can delete their hints
    if (hint.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own hints');
    }

    await this.prisma.hint.delete({
      where: { id },
    });
  }
}
