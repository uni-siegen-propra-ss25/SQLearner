import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth/jwt-auth.guard';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { TodosService } from '../services/todos.service';
import { CreateTodoDto, UpdateTodoDto } from '../dto/todo.dto';
import { TodoData } from '../models/todo.model';

@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(
    @GetUser('id') userId: number,
    @Body() createTodoDto: CreateTodoDto,
  ): Promise<TodoData> {
    return this.todosService.create(userId, createTodoDto);
  }

  @Get()
  findAll(@GetUser('id') userId: number): Promise<TodoData[]> {
    return this.todosService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
  ): Promise<TodoData> {
    return this.todosService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
    @Body() updateTodoDto: UpdateTodoDto,
  ): Promise<TodoData> {
    return this.todosService.update(id, userId, updateTodoDto);
  }

  @Patch(':id/toggle')
  toggleCompleted(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
  ): Promise<TodoData> {
    return this.todosService.toggleCompleted(id, userId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number,
  ): Promise<void> {
    return this.todosService.remove(id, userId);
  }
}
