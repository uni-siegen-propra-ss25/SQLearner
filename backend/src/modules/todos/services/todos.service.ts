import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { todos as Todo } from '@prisma/client';

@Injectable()
export class TodosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(role: 'TUTOR' | 'STUDENT'): Promise<Todo[]> {
    return this.prisma.todos.findMany({
      where: { role },
    });
  }

  create(text: string, role: 'TUTOR' | 'STUDENT'): Promise<Todo> {
    return this.prisma.todos.create({
      data: {
        text,
        role,
        done: false,
      },
    });
  }

  async update(id: number, done: boolean): Promise<Todo> {
    const todo = await this.prisma.todos.findUnique({
      where: { id },
    });
    if (!todo) throw new Error(`Todo with id ${id} not found`);

    return this.prisma.todos.update({
      where: { id },
      data: { done },
    });
  }

  async remove(id: number): Promise<void> {
    await this.prisma.todos.delete({
      where: { id },
    });
  }
}

