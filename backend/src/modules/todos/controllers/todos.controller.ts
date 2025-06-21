import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { todos as Todo } from '@prisma/client';
import { TodosService } from '../services/todos.service';

/**
 * Controller for managing Todo HTTP requests.
 */
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  /**
   * GET /todos?role=... - Get all todos for a specific role
   */
  @Get()
  findAll(@Query('role') role: 'TUTOR' | 'STUDENT'): Promise<Todo[]> {
    return this.todosService.findAll(role);
  }

  /**
   * POST /todos - Create a new todo
   */
  @Post()
  create(
    @Body('text') text: string,
    @Body('role') role: 'TUTOR' | 'STUDENT',
  ): Promise<Todo> {
    return this.todosService.create(text, role);
  }

  /**
   * PATCH /todos/:id - Update a todo's status
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body('done') done: boolean,
  ): Promise<Todo> {
    return this.todosService.update(+id, done);
  }

  /**
   * DELETE /todos/:id - Permanently delete a todo
   */
  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.todosService.remove(+id);
  }
}
