import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../todos.entity';

/**
 * Service for managing Todo entities.
 */
@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  /**
   * Get all todos by role.
   */
  findAll(role: 'TUTOR' | 'STUDENT'): Promise<Todo[]> {
    return this.todoRepository.find({ where: { role } });
  }

  /**
   * Create a new todo item.
   */
  create(text: string, role: 'TUTOR' | 'STUDENT'): Promise<Todo> {
    const todo = this.todoRepository.create({ text, role });
    return this.todoRepository.save(todo);
  }

  /**
   * Update the completion status of a todo.
   */
  async update(id: number, done: boolean): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) throw new Error(`Todo with id ${id} not found`);
    todo.done = done;
    return this.todoRepository.save(todo);
  }

  /**
   * Permanently remove a todo.
   */
  async remove(id: number): Promise<void> {
    await this.todoRepository.delete(id);
  }
}

