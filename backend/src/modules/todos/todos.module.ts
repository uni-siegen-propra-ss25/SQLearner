import { Module } from '@nestjs/common';
import { TodosService } from './services/todos.service';
import { TodosController } from './controllers/todos.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TodosService, PrismaService],
  controllers: [TodosController],
})
export class TodosModule {}
