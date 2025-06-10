import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { Todo } from '../todos.entity';
import { TodosService } from '../services/todos.service';

@Controller('todos') // Alle Routen starten mit /todos
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  // GET /todos?role=TUTOR → Alle Todos für eine bestimmte Rolle abrufen
  @Get()
  findAll(@Query('role') role: 'TUTOR' | 'STUDENT'): Promise<Todo[]> {
    return this.todosService.findAll(role);
  }

  // POST /todos → Neue Aufgabe erstellen (Text & Rolle im Body)
  @Post()
  create(
    @Body('text') text: string,
    @Body('role') role: 'TUTOR' | 'STUDENT',
  ): Promise<Todo> {
    return this.todosService.create(text, role);
  }

  // PATCH /todos/:id → Status "done" einer Aufgabe ändern
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('done') done: boolean,
  ): Promise<Todo> {
    return this.todosService.update(+id, done); // +id: Konvertiert ID zu Zahl
  }

  // DELETE /todos/:id → Aufgabe dauerhaft löschen
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.todosService.remove(+id);
  }
}
