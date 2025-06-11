import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../question.entity';
import { CreateQuestionDto } from '../dto/create-question.dto';

@Injectable() // Kennzeichnet den Service als Provider (wird von NestJS verwaltet)
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>, // Zugriff auf die DB über das Repository
  ) {}

  // Erstellt eine neue Frage in der DB
  create(dto: CreateQuestionDto) {
    const question = this.questionRepository.create(dto); // Erstellt neues Question-Objekt
    return this.questionRepository.save(question); // Speichert es in der Datenbank
  }

  // Gibt alle Fragen zurück, die NICHT gelöscht sind, sortiert nach Erstellungsdatum (neu zuerst)
  findAll() {
    return this.questionRepository.find({
      order: { erstellt_am: 'DESC' },
      where: { ist_geloescht: false },
    });
  }
  // FrageService → unterhalb von findAll()
  findGeloeschte() {
  return this.questionRepository.find({
    order: { erstellt_am: 'DESC' },
    where: { ist_geloescht: true },
  });
}


  // Setzt Antworttext und den Status "beantwortet" auf true
  updateAntwort(id: number, antwort: string) {
    return this.questionRepository.update(id, { antwort, ist_beantwortet: true });
  }

  // Pinnt oder entpinnt eine Frage
  updatePin(id: number, ist_angepinnt: boolean) {
    return this.questionRepository.update(id, { ist_angepinnt });
  }

  // Archiviert oder entarchiviert eine Frage
  updateArchiv(id: number, ist_archiviert: boolean) {
    return this.questionRepository.update(id, { ist_archiviert });
  }

  // "Löscht" eine Frage – jedoch nur soft delete (Daten bleiben erhalten)
  delete(id: number) {
    return this.questionRepository.update(id, { ist_geloescht: true });
  }

  updateGeloescht(id: number, ist_geloescht: boolean) {
  return this.questionRepository.update(id, { ist_geloescht });
}
// Frage komplett aus der DB entfernen (Hard Delete)
async hardDelete(id: number): Promise<void> {
  await this.questionRepository.delete(id);
}
}
