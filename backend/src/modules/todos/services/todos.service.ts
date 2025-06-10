import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../todos.entity';

@Injectable() // Macht den Service injizierbar
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>, // Zugriff auf die Datenbanktabelle „Todo“
  ) {}

  // Gibt alle Todos einer bestimmten Rolle zurück (z. B. alle Aufgaben für TUTOREN)
  findAll(role: 'TUTOR' | 'STUDENT'): Promise<Todo[]> {
    return this.todoRepository.find({ where: { role } });
  }

  // Erstellt eine neue Todo mit Text und Rolle
  create(text: string, role: 'TUTOR' | 'STUDENT'): Promise<Todo> {
    const todo = this.todoRepository.create({ text, role }); // Erstellt ein neues Entity-Objekt
    return this.todoRepository.save(todo); // Speichert das Objekt in der Datenbank
  }

  // Aktualisiert den Status "done" für eine bestimmte Todo
  async update(id: number, done: boolean): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ id }); // Holt die Aufgabe mit der ID
    if (!todo) throw new Error(`Todo mit id ${id} nicht gefunden`); // Fehlerbehandlung bei ungültiger ID
    todo.done = done; // Ändert den Status
    return this.todoRepository.save(todo); // Speichert die Änderung
  }

  // Löscht eine Aufgabe dauerhaft aus der Datenbank
  async remove(id: number): Promise<void> {
    await this.todoRepository.delete(id);
  }
}
