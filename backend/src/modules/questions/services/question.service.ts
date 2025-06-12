import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../question.entity';
import { CreateQuestionDto } from '../dto/create-question.dto';

/**
 * Service for managing Question entities.
 */
@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  /**
   * Create a new question.
   */
  create(dto: CreateQuestionDto) {
    const question = this.questionRepository.create(dto);
    return this.questionRepository.save(question);
  }

  /**
   * Find all non-deleted questions, sorted by date descending.
   */
  findAll() {
    return this.questionRepository.find({
      order: { erstellt_am: 'DESC' },
      where: { ist_geloescht: false },
    });
  }

  /**
   * Find all soft-deleted questions.
   */
  findGeloeschte() {
    return this.questionRepository.find({
      order: { erstellt_am: 'DESC' },
      where: { ist_geloescht: true },
    });
  }

  /**
   * Update the answer of a question.
   */
  updateAntwort(id: number, antwort: string) {
    return this.questionRepository.update(id, { antwort, ist_beantwortet: true });
  }

  /**
   * Pin or unpin a question.
   */
  updatePin(id: number, ist_angepinnt: boolean) {
    return this.questionRepository.update(id, { ist_angepinnt });
  }

  /**
   * Archive or unarchive a question.
   */
  updateArchiv(id: number, ist_archiviert: boolean) {
    return this.questionRepository.update(id, { ist_archiviert });
  }

  /**
   * Soft delete a question.
   */
  delete(id: number) {
    return this.questionRepository.update(id, { ist_geloescht: true });
  }

  /**
   * Set soft-delete flag.
   */
  updateGeloescht(id: number, ist_geloescht: boolean) {
    return this.questionRepository.update(id, { ist_geloescht });
  }

  /**
   * Hard delete a question from the database.
   */
  async hardDelete(id: number): Promise<void> {
    await this.questionRepository.delete(id);
  }
}
