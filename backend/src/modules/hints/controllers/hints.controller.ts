import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { HintsService } from '../services/hints.service';

/**
 * Controller for handling HTTP requests related to hints.
 */
@Controller('hints')
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  /**
   * GET /hints - Retrieve all hints
   */
  @Get()
  findAll() {
    return this.hintsService.findAll();
  }

  /**
   * POST /hints - Create a new hint
   * @param body Object containing the hint text
   */
  @Post()
  create(@Body() body: { text: string }) {
    return this.hintsService.create(body.text);
  }

  /**
   * DELETE /hints/:id - Delete a hint by ID
   * @param id The ID of the hint to delete
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hintsService.remove(+id);
  }
}
