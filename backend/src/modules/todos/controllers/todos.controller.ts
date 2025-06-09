import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { Todo } from '../todos.entity';
import { TodosService } from '../services/todos.service';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  // z. B. GET /todos?role=TUTOR
  @Get()
  findAll(@Query('role') role: 'TUTOR' | 'STUDENT'): Promise<Todo[]> {
    return this.todosService.findAll(role);
  }

  @Post()
  create(
    @Body('text') text: string,
    @Body('role') role: 'TUTOR' | 'STUDENT',
  ): Promise<Todo> {
    return this.todosService.create(text, role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('done') done: boolean,
  ): Promise<Todo> {
    return this.todosService.update(+id, done);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.todosService.remove(+id);
  }
}
