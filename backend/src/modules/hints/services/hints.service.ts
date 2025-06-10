import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hint } from '../hints.entity';

// Kennzeichnet die Klasse als Service, der von NestJS verwaltet wird
@Injectable()
export class HintsService {
  // Injektion des Hint-Repositories für Datenbankoperationen
  constructor(
    @InjectRepository(Hint)
    private hintRepository: Repository<Hint>,
  ) {}

  // Gibt alle gespeicherten Hinweise zurück
  findAll(): Promise<Hint[]> {
    return this.hintRepository.find();
  }

  // Erstellt einen neuen Hinweis und speichert ihn in der Datenbank
  create(text: string): Promise<Hint> {
    const hint = this.hintRepository.create({ text }); // Objekt erstellen
    return this.hintRepository.save(hint); // In DB speichern
  }

  // Löscht einen Hinweis anhand seiner ID
  remove(id: number): Promise<void> {
    return this.hintRepository.delete(id).then(() => undefined);
  }
}
