import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; 
import { fragen, Prisma } from '@prisma/client';
import { CreateQuestionDto } from '../dto/create-question.dto';

@Injectable()
export class QuestionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new question in the database using the provided data transfer object.
   * Sets default values for nullable fields if not provided.
   */
  create(dto: CreateQuestionDto) {
    const data: Prisma.fragenCreateInput = {
      student_name: dto.student_name,
      frage: dto.frage,
      antwort: null,
      erstellt_am: new Date(dto.erstellt_am ?? new Date().toISOString()),
      ist_archiviert: dto.ist_archiviert ?? false,
      ist_angepinnt: dto.ist_angepinnt ?? false,
      ist_geloescht: dto.ist_geloescht ?? false,
      ist_beantwortet: dto.ist_beantwortet ?? false,
    };

    return this.prisma.fragen.create({ data });
  }

  /**
   * Retrieves all active (non-deleted) questions sorted by creation date descending.
   */
  findAll(): Promise<fragen[]> {
    return this.prisma.fragen.findMany({
      where: { ist_geloescht: false },
      orderBy: { erstellt_am: 'desc' },
    });
  }

  /**
   * Retrieves all deleted questions (questions in the "trash").
   */
  findGeloeschte(): Promise<fragen[]> {
    return this.prisma.fragen.findMany({
      where: { ist_geloescht: true },
      orderBy: { erstellt_am: 'desc' },
    });
  }

  /**
   * Updates the answer of a question and marks it as answered.
   */
  updateAntwort(id: number, antwort: string): Promise<fragen> {
    return this.prisma.fragen.update({
      where: { id },
      data: { antwort, ist_beantwortet: true },
    });
  }

  /**
   * Updates the pinned status of a question.
   */
  updatePin(id: number, ist_angepinnt: boolean): Promise<fragen> {
    return this.prisma.fragen.update({
      where: { id },
      data: { ist_angepinnt },
    });
  }

  /**
   * Updates the archived status of a question.
   */
  updateArchiv(id: number, ist_archiviert: boolean): Promise<fragen> {
    return this.prisma.fragen.update({
      where: { id },
      data: { ist_archiviert },
    });
  }

  /**
   * Updates the deleted (soft-delete) status of a question.
   */
  updateGeloescht(id: number, ist_geloescht: boolean): Promise<fragen> {
    return this.prisma.fragen.update({
      where: { id },
      data: { ist_geloescht },
    });
  }

  /**
   * Permanently deletes a question from the database (hard delete).
   */
  async hardDelete(id: number): Promise<void> {
    await this.prisma.fragen.delete({ where: { id } });
  }
}
