import { Component, OnInit } from '@angular/core';
import { QuestionService } from 'app/features/welcome/services/question.service';

@Component({
  selector: 'app-beantwortet',
  templateUrl: './beantwortet.component.html',
  styleUrls: ['./beantwortet.component.scss'],
})
export class BeantwortetComponent implements OnInit {
  beantworteteFragen: any[] = [];

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    this.ladeBeantworteteFragen();
  }

  ladeBeantworteteFragen(): void {
    this.questionService.getAll().subscribe((data) => {
      this.beantworteteFragen = data.filter(
        (frage) =>
          frage.ist_beantwortet &&
          !frage.ist_archiviert &&
          !frage.ist_geloescht &&
          !frage.ist_angepinnt
      );
    });
  }

  // Archivieren
  insArchivVerschieben(frage: any): void {
    this.questionService.archivieren(frage.id, true).subscribe(() => {
      this.entfernenAusListe(frage.id);
    });
  }

  // Löschen
  inPapierkorbVerschieben(frage: any): void {
    this.questionService.löschen(frage.id).subscribe(() => {
      this.entfernenAusListe(frage.id);
    });
  }

  // Anpinnen
  markieren(frage: any): void {
    this.questionService.pin(frage.id, true).subscribe(() => {
      this.entfernenAusListe(frage.id);
    });
  }

  private entfernenAusListe(frageId: number): void {
    this.beantworteteFragen = this.beantworteteFragen.filter((f) => f.id !== frageId);
  }
}

