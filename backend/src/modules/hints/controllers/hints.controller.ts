import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { HintsService } from '../services/hints.service';

// Definiert den Controller für die Route /hints
@Controller('hints')
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  // GET /hints → Holt alle Hinweise
  @Get()
  findAll() {
    return this.hintsService.findAll();
  }

  // POST /hints → Erstellt einen neuen Hinweis
  @Post()
  create(@Body() body: { text: string }) {
    return this.hintsService.create(body.text);
  }

  // DELETE /hints/:id → Löscht einen Hinweis per ID
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hintsService.remove(+id); // +id konvertiert von string zu number
  }
}
