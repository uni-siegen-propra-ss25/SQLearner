import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto } from '../dto/create-question.dto';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  /**
   * Creates a new question entry with default values for status flags.
   * Automatically sets creation date and initializes other properties.
   */
  @Post()
  create(@Body() dto: CreateQuestionDto) {
    return this.questionService.create({
      ...dto,
      erstellt_am: new Date().toISOString(),
      ist_archiviert: false,
      ist_angepinnt: false,
      ist_beantwortet: false,
      ist_geloescht: false,
    });
  }

  /**
   * Retrieves all non-deleted questions, ordered by creation date (descending).
   */
  @Get()
  findAll() {
    return this.questionService.findAll();
  }

  /**
   * Retrieves all questions marked as deleted (i.e., moved to the trash).
   */
  @Get('papierkorb')
  findGeloeschte() {
    return this.questionService.findGeloeschte();
  }

  /**
   * Adds an answer to a question and marks it as answered.
   */
  @Patch(':id/antwort')
  antwort(@Param('id') id: string, @Body('antwort') antwort: string) {
    return this.questionService.updateAntwort(+id, antwort);
  }

  /**
   * Pins or unpins a question based on the given boolean flag.
   */
  @Patch(':id/pin')
  pin(@Param('id') id: string, @Body('ist_angepinnt') ist_angepinnt: boolean) {
    return this.questionService.updatePin(+id, ist_angepinnt);
  }

  /**
   * Archives or unarchives a question.
   */
  @Patch(':id/archiv')
  archiv(@Param('id') id: string, @Body('ist_archiviert') ist_archiviert: boolean) {
    return this.questionService.updateArchiv(+id, ist_archiviert);
  }

  /**
   * Soft-deletes or restores a question by updating its "deleted" status.
   */
  @Patch(':id/delete')
  patchGeloescht(@Param('id') id: string, @Body('ist_geloescht') ist_geloescht: boolean) {
    return this.questionService.updateGeloescht(+id, ist_geloescht);
  }

  /**
   * Permanently deletes a question from the database.
   */
  @Delete(':id')
  async hardDelete(@Param('id') id: string) {
    await this.questionService.hardDelete(+id);
    return { message: 'Question was permanently deleted' };
  }
}
