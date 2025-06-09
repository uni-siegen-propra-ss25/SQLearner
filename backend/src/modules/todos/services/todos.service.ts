import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo } from '../todos.entity';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  findAll(role: 'TUTOR' | 'STUDENT'): Promise<Todo[]> {
    return this.todoRepository.find({ where: { role } });
  }

  create(text: string, role: 'TUTOR' | 'STUDENT'): Promise<Todo> {
    const todo = this.todoRepository.create({ text, role });
    return this.todoRepository.save(todo);
  }

  async update(id: number, done: boolean): Promise<Todo> {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) throw new Error(`Todo mit id ${id} nicht gefunden`);
    todo.done = done;
    return this.todoRepository.save(todo);
  }

  async remove(id: number): Promise<void> {
    await this.todoRepository.delete(id);
  }
}
