import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTodoDto, UpdateTodoDto } from '../dto/todo.dto';
import { TodoData } from '../models/todo.model';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: number): Promise<TodoData[]> {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: [
        { completed: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(id: number, userId: number): Promise<TodoData> {
    const todo = await this.prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    if (todo.userId !== userId) {
      throw new ForbiddenException('You can only access your own todos');
    }

    return todo;
  }

  async create(userId: number, createTodoDto: CreateTodoDto): Promise<TodoData> {
    return this.prisma.todo.create({
      data: {
        ...createTodoDto,
        userId,
        dueDate: createTodoDto.dueDate ? new Date(createTodoDto.dueDate) : null,
      },
    });
  }

  async update(id: number, userId: number, updateTodoDto: UpdateTodoDto): Promise<TodoData> {
    // Check if todo exists and belongs to user
    await this.findOne(id, userId);

    return this.prisma.todo.update({
      where: { id },
      data: {
        ...updateTodoDto,
        dueDate: updateTodoDto.dueDate ? new Date(updateTodoDto.dueDate) : undefined,
      },
    });
  }

  async remove(id: number, userId: number): Promise<void> {
    // Check if todo exists and belongs to user
    await this.findOne(id, userId);

    await this.prisma.todo.delete({
      where: { id },
    });
  }

  async toggleCompleted(id: number, userId: number): Promise<TodoData> {
    const todo = await this.findOne(id, userId);
    
    return this.prisma.todo.update({
      where: { id },
      data: { completed: !todo.completed },
    });
  }
}
