import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto } from '../dto/create-question.dto';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

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

  @Get()
  findAll() {
    return this.questionService.findAll();
  }

  @Get('papierkorb')
  findGeloeschte() {
    return this.questionService.findGeloeschte();
  }

  @Patch(':id/antwort')
  antwort(@Param('id') id: string, @Body('antwort') antwort: string) {
    return this.questionService.updateAntwort(+id, antwort);
  }

  @Patch(':id/pin')
  pin(@Param('id') id: string, @Body('ist_angepinnt') ist_angepinnt: boolean) {
    return this.questionService.updatePin(+id, ist_angepinnt);
  }

  @Patch(':id/archiv')
  archiv(@Param('id') id: string, @Body('ist_archiviert') ist_archiviert: boolean) {
    return this.questionService.updateArchiv(+id, ist_archiviert);
  }

  @Patch(':id/delete')
  patchGeloescht(@Param('id') id: string, @Body('ist_geloescht') ist_geloescht: boolean) {
    return this.questionService.updateGeloescht(+id, ist_geloescht);
  }

  @Delete(':id')
  async hardDelete(@Param('id') id: string) {
    await this.questionService.hardDelete(+id);
    return { message: 'Frage wurde endgültig gelöscht' };
  }
}
