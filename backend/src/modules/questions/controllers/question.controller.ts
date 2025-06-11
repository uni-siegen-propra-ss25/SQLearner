import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { Delete } from '@nestjs/common';

/**
 * Controller for handling questions-related routes.
 */
@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  /**
   * POST /questions - Create a new question
   */
  @Post()
  create(@Body() dto: CreateQuestionDto) {
    dto.erstellt_am = new Date().toISOString();
    dto.ist_archiviert = false;
    dto.ist_angepinnt = false;
    dto.ist_beantwortet = false;
    dto.ist_geloescht = false;

    return this.questionService.create(dto);
  }

  /**
   * GET /questions - Get all non-deleted questions
   */
  @Get()
  findAll() {
    return this.questionService.findAll();
  }

  /**
   * PATCH /questions/:id/antwort - Update the answer of a question
   */
  @Patch(':id/antwort')
  antwort(@Param('id') id: string, @Body('antwort') antwort: string) {
    return this.questionService.updateAntwort(+id, antwort);
  }

  /**
   * PATCH /questions/:id/pin - Pin or unpin a question
   */
  @Patch(':id/pin')
  pin(@Param('id') id: string, @Body('ist_angepinnt') ist_angepinnt: boolean) {
    return this.questionService.updatePin(+id, ist_angepinnt);
  }

  /**
   * PATCH /questions/:id/archiv - Archive or unarchive a question
   */
  @Patch(':id/archiv')
  archiv(@Param('id') id: string, @Body('ist_archiviert') ist_archiviert: boolean) {
    return this.questionService.updateArchiv(+id, ist_archiviert);
  }

  /**
   * PATCH /questions/:id/delete - Soft delete a question
   */
  @Patch(':id/delete')
  patchGeloescht(@Param('id') id: string, @Body('ist_geloescht') ist_geloescht: boolean) {
    return this.questionService.updateGeloescht(+id, ist_geloescht);
  }

  /**
   * GET /questions/papierkorb - Get all soft-deleted questions
   */
  @Get('papierkorb')
  findGeloeschte() {
    return this.questionService.findGeloeschte();
  }

  /**
   * DELETE /questions/:id - Hard delete a question
   */
  @Delete(':id')
  async hardDelete(@Param('id') id: string) {
    await this.questionService.hardDelete(+id);
    return { message: 'Frage wurde endgültig gelöscht' };
  }
}
