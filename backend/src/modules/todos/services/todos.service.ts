import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { todos as Todo } from '@prisma/client';

// Service to handle business logic for managing todos
@Injectable()
export class TodosService {
  // Inject PrismaService for database access
  constructor(private readonly prisma: PrismaService) {}

  // Retrieve all todos based on user role (TUTOR or STUDENT)
  findAll(role: 'TUTOR' | 'STUDENT'): Promise<Todo[]> {
    return this.prisma.todos.findMany({
      where: { role },
    });
  }

  // Create a new todo for the specified role
  create(text: string, role: 'TUTOR' | 'STUDENT'): Promise<Todo> {
    return this.prisma.todos.create({
      data: {
        text,
        role,
        done: false, // Todos are initially not done
      },
    });
  }

  // Update the 'done' status of a todo item
  async update(id: number, done: boolean): Promise<Todo> {
    // Find the todo by ID
    const todo = await this.prisma.todos.findUnique({
      where: { id },
    });

    // If the todo does not exist, throw an error
    if (!todo) throw new Error(`Todo with id ${id} not found`);

    // Update the 'done' status
    return this.prisma.todos.update({
      where: { id },
      data: { done },
    });
  }

  // Delete a todo by its ID
  async remove(id: number): Promise<void> {
    await this.prisma.todos.delete({
      where: { id },
    });
  }
}
