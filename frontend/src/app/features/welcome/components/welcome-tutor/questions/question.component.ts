import { Component, OnInit } from '@angular/core';
import { QuestionService } from 'app/features/welcome/services/question.service';

@Component({
  selector: 'app-questions',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit {
  questions: any[] = []; // Keine Testdaten mehr
  angepinnt: any[] = [];
  ausgewaehlteQuestion: any = null;
  antwortText: string = '';
  anhangName: string = '';

  get ungeleseneNachrichten(): number {
    return this.questions.length;
  }

constructor(private questionService: QuestionService) {}

ngOnInit() {
this.questionService.getAll().subscribe((data) => {
const ungefiltert = data.filter(q => !q.ist_archiviert && !q.ist_geloescht);
this.angepinnt = ungefiltert.filter(q => q.ist_angepinnt);
this.questions = ungefiltert.filter(q => !q.ist_angepinnt);
});

}


  beantworten(frage: any, event: Event) {
    event.preventDefault();
    this.ausgewaehlteQuestion = frage;
    this.antwortText = '';
    this.anhangName = '';
  }

  antwortAbbrechen() {
    this.ausgewaehlteQuestion = null;
    this.antwortText = '';
    this.anhangName = '';
  }

  anhangHinzufuegen(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.anhangName = file.name;
    }
  }

antwortAbschicken() {
  if (!this.ausgewaehlteQuestion) return;

  this.questionService.antworten(this.ausgewaehlteQuestion.id, this.antwortText).subscribe(() => {
    this.questions = this.questions.filter((f) => f.id !== this.ausgewaehlteQuestion.id);
    this.antwortAbbrechen();
  });
}


anpinnen(frage: any, event: Event) {
  event.preventDefault();

  if (!this.angepinnt.find((f) => f.id === frage.id)) {
    this.questionService.pin(frage.id, true).subscribe(() => {
      this.angepinnt.push(frage);
      this.questions = this.questions.filter((f) => f.id !== frage.id);
    });
  }
}


archivieren(frage: any, event: Event) {
  event.preventDefault();
  this.questionService.archivieren(frage.id, true).subscribe(() => {
    this.questions = this.questions.filter((f) => f.id !== frage.id);
  });
}


loeschen(frage: any, event: Event) {
  event.preventDefault();
  this.questionService.löschen(frage.id).subscribe(() => {
    // Frage lokal als gelöscht markieren (falls du später noch was anzeigen willst)
    frage.ist_geloescht = true;
    // aus der sichtbaren Liste entfernen
    this.questions = this.questions.filter((f) => f.id !== frage.id);
  });
}



entferneAngepinnt(frage: any, event: Event) {
  event.preventDefault();
  this.questionService.pin(frage.id, false).subscribe(() => {
    this.angepinnt = this.angepinnt.filter((f) => f.id !== frage.id);
  });
}
}

