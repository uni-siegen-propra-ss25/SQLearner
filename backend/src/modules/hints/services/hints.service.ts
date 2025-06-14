import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class HintsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.hint.findMany();
  }

  create(text: string) {
    return this.prisma.hint.create({
      data: { text },
    });
  }

  async remove(id: number): Promise<void> {
    await this.prisma.hint.delete({
      where: { id },
    });
  }
}
