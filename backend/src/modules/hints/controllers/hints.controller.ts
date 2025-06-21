import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { HintsService } from '../services/hints.service';

// Controller that handles HTTP requests related to "hints"
@Controller('hints')
export class HintsController {
  // Inject the HintsService to delegate business logic
  constructor(private readonly hintsService: HintsService) {}

  // GET /hints - Fetch all hints from the database
  @Get()
  findAll() {
    return this.hintsService.findAll();
  }

  // POST /hints - Create a new hint with the provided text
  @Post()
  create(@Body() body: { text: string }) {
    return this.hintsService.create(body.text);
  }

  // DELETE /hints/:id - Delete a hint by its ID
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hintsService.remove(+id); // Convert string ID to number
  }
}
