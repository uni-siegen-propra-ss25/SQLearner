import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../question.entity';
import { CreateQuestionDto } from '../dto/create-question.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  create(dto: CreateQuestionDto) {
    const question = this.questionRepository.create(dto);
    return this.questionRepository.save(question);
  }

  findAll() {
    return this.questionRepository.find({
      order: { erstellt_am: 'DESC' },
      where: { ist_geloescht: false }, // gelöschte Fragen ausblenden
    });
  }

  updateAntwort(id: number, antwort: string) {
    return this.questionRepository.update(id, { antwort, ist_beantwortet: true });
  }

  updatePin(id: number, ist_angepinnt: boolean) {
    return this.questionRepository.update(id, { ist_angepinnt });
  }

  updateArchiv(id: number, ist_archiviert: boolean) {
    return this.questionRepository.update(id, { ist_archiviert });
  }

  delete(id: number) {
    return this.questionRepository.update(id, { ist_geloescht: true });
  }
}

