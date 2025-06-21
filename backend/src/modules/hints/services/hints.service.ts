import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

// Service that contains business logic for handling hints
@Injectable()
export class HintsService {
  // Inject PrismaService to interact with the database
  constructor(private prisma: PrismaService) {}

  // Retrieve all hints from the database
  findAll() {
    return this.prisma.hint.findMany();
  }

  // Create a new hint with the given text
  create(text: string) {
    return this.prisma.hint.create({
      data: { text },
    });
  }

  // Delete a hint by its ID
  async remove(id: number): Promise<void> {
    await this.prisma.hint.delete({
      where: { id },
    });
  }
}

