import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; 
import { fragen, Prisma } from '@prisma/client';
import { CreateQuestionDto } from '../dto/create-question.dto';

@Injectable()
export class QuestionService {
  constructor(private readonly prisma: PrismaService) {}

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


  findAll(): Promise<fragen[]> {
    return this.prisma.fragen.findMany({
      where: { ist_geloescht: false },
      orderBy: { erstellt_am: 'desc' },
    });
  }

  findGeloeschte(): Promise<fragen[]> {
    return this.prisma.fragen.findMany({
      where: { ist_geloescht: true },
      orderBy: { erstellt_am: 'desc' },
    });
  }

  updateAntwort(id: number, antwort: string): Promise<fragen> {
    return this.prisma.fragen.update({
      where: { id },
      data: { antwort, ist_beantwortet: true },
    });
  }

  updatePin(id: number, ist_angepinnt: boolean): Promise<fragen> {
    return this.prisma.fragen.update({
      where: { id },
      data: { ist_angepinnt },
    });
  }

  updateArchiv(id: number, ist_archiviert: boolean): Promise<fragen> {
    return this.prisma.fragen.update({
      where: { id },
      data: { ist_archiviert },
    });
  }

  updateGeloescht(id: number, ist_geloescht: boolean): Promise<fragen> {
    return this.prisma.fragen.update({
      where: { id },
      data: { ist_geloescht },
    });
  }

  async hardDelete(id: number): Promise<void> {
    await this.prisma.fragen.delete({ where: { id } });
  }
}
