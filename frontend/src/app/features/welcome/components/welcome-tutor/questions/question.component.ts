import { Component, OnInit } from '@angular/core';
import { QuestionService } from 'app/features/welcome/services/question.service';

// Deklariert die Komponente mit Selektor, Template- und Style-Dateien
@Component({
  selector: 'app-questions',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
})
export class QuestionComponent implements OnInit {
  // Variablen für Fragen
  questions: any[] = [];            // Alle nicht-archivierten & nicht-gelöschten Fragen
  angepinnt: any[] = [];            // Markierte (angepinnte) Fragen
  ausgewaehlteQuestion: any = null; // Aktuell beantwortete Frage
  antwortText: string = '';         // Antworttext im Modal
  anhangName: string = '';          // Name der hochgeladenen Datei

  // Berechnet dynamisch die Anzahl unbeantworteter Fragen
  get ungeleseneNachrichten(): number {
    return this.questions.length;
  }

  constructor(private questionService: QuestionService) {}

  // Beim Initialisieren alle Fragen laden und sortieren
  ngOnInit() {
    this.questionService.getAll().subscribe((data) => {
      const ungefiltert = data.filter(q => !q.ist_archiviert && !q.ist_geloescht);
      this.angepinnt = ungefiltert.filter(q => q.ist_angepinnt);
      this.questions = ungefiltert.filter(q => !q.ist_angepinnt);
    });
  }

  // Frage wird ausgewählt zum Beantworten
  beantworten(frage: any, event: Event) {
    event.preventDefault();
    this.ausgewaehlteQuestion = frage;
    this.antwortText = '';
    this.anhangName = '';
  }

  // Beantwortungsprozess abbrechen
  antwortAbbrechen() {
    this.ausgewaehlteQuestion = null;
    this.antwortText = '';
    this.anhangName = '';
  }

  // Datei anhängen
  anhangHinzufuegen(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.anhangName = file.name;
    }
  }

  // Antwort absenden und Frage entfernen
  antwortAbschicken() {
    if (!this.ausgewaehlteQuestion) return;

    this.questionService.antworten(this.ausgewaehlteQuestion.id, this.antwortText).subscribe(() => {
      this.questions = this.questions.filter((f) => f.id !== this.ausgewaehlteQuestion.id);
      this.antwortAbbrechen();
    });
  }

  // Frage anpinnen/markieren
  anpinnen(frage: any, event: Event) {
    event.preventDefault();

    if (!this.angepinnt.find((f) => f.id === frage.id)) {
      this.questionService.pin(frage.id, true).subscribe(() => {
        this.angepinnt.push(frage);
        this.questions = this.questions.filter((f) => f.id !== frage.id);
      });
    }
  }

  // Frage archivieren
  archivieren(frage: any, event: Event) {
    event.preventDefault();
    this.questionService.archivieren(frage.id, true).subscribe(() => {
      this.questions = this.questions.filter((f) => f.id !== frage.id);
    });
  }

  // Frage löschen
  loeschen(frage: any, event: Event) {
    event.preventDefault();
    this.questionService.löschen(frage.id).subscribe(() => {
      frage.ist_geloescht = true;
      this.questions = this.questions.filter((f) => f.id !== frage.id);
    });
  }

  // Frage von der Markierung entfernen
  entferneAngepinnt(frage: any, event: Event) {
    event.preventDefault();
    this.questionService.pin(frage.id, false).subscribe(() => {
      this.angepinnt = this.angepinnt.filter((f) => f.id !== frage.id);
    });
  }
}
