import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { HintsService } from '../services/hints.service';

@Controller('hints')
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  @Get()
  findAll() {
    return this.hintsService.findAll();
  }

  @Post()
  create(@Body() body: { text: string }) {
    return this.hintsService.create(body.text);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hintsService.remove(+id);
  }
}
