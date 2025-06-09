import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Todo } from './todos.entity';
import { TodosService } from './services/todos.service';
import { TodosController } from './controllers/todos.controller';


@Module({
  imports: [TypeOrmModule.forFeature([Todo])], // Entity registrieren
  providers: [TodosService],
  controllers: [TodosController],
})
export class TodosModule {}
