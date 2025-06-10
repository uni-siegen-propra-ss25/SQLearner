import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto } from '../dto/create-question.dto';

@Controller('questions') // Routenprefix: alle Endpunkte starten mit /questions
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // POST /questions → Neue Frage einreichen
  @Post()
  create(@Body() dto: CreateQuestionDto) {
    // Setzt Standardwerte, die nicht vom Nutzer kommen müssen
    dto.erstellt_am = new Date().toISOString();  
    dto.ist_archiviert = false;
    dto.ist_angepinnt = false;
    dto.ist_beantwortet = false;
    dto.ist_geloescht = false;

    return this.questionService.create(dto);
  }

  // GET /questions → Alle (nicht gelöschten) Fragen abrufen
  @Get()
  findAll() {
    return this.questionService.findAll();
  }

  // PATCH /questions/:id/antwort → Antwort auf eine Frage hinzufügen
  @Patch(':id/antwort')
  antwort(@Param('id') id: string, @Body('antwort') antwort: string) {
    return this.questionService.updateAntwort(+id, antwort); // +id: String zu Zahl
  }

  // PATCH /questions/:id/pin → Frage anpinnen oder entpinnen
  @Patch(':id/pin')
  pin(@Param('id') id: string, @Body('ist_angepinnt') ist_angepinnt: boolean) {
    return this.questionService.updatePin(+id, ist_angepinnt);
  }

  // PATCH /questions/:id/archiv → Frage archivieren oder entarchivieren
  @Patch(':id/archiv')
  archiv(@Param('id') id: string, @Body('ist_archiviert') ist_archiviert: boolean) {
    return this.questionService.updateArchiv(+id, ist_archiviert);
  }

  // PATCH /questions/:id/delete → Frage "löschen" (Soft Delete)
  @Patch(':id/delete')
  delete(@Param('id') id: string) {
    return this.questionService.delete(+id);
  }
}
