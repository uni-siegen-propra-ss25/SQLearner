import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto } from '../dto/create-question.dto';

@Controller('questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

@Post()
create(@Body() dto: CreateQuestionDto) {
  // Setze zusätzliche Felder auf dto
  dto.erstellt_am = new Date().toISOString();  
  dto.ist_archiviert = false;
  dto.ist_angepinnt = false;
  dto.ist_beantwortet = false;
  dto.ist_geloescht = false;

  return this.questionService.create(dto);
}



  @Get()
  findAll() {
    return this.questionService.findAll();
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
  delete(@Param('id') id: string) {
    return this.questionService.delete(+id);
  }
}
