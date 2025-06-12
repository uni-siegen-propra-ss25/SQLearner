import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';  
import { QuestionService } from 'app/features/welcome/services/question.service';

@Component({
  selector: 'app-beantwortet',
  templateUrl: './beantwortet.component.html',
  styleUrls: ['./beantwortet.component.scss'],
})
export class BeantwortetComponent implements OnInit {
  // List of answered questions (not archived or deleted)
  beantworteteFragen: any[] = [];

constructor(
  private questionService: QuestionService,
  private router: Router  
) {}

  ngOnInit(): void {
    this.ladeBeantworteteFragen();
  }

  // Load questions that are answered, but not archived or deleted
  ladeBeantworteteFragen(): void {
    this.questionService.getAll().subscribe((data) => {
      this.beantworteteFragen = data.filter(
        frage =>
          frage.ist_beantwortet &&
          !frage.ist_archiviert &&
          !frage.ist_geloescht &&
          !frage.ist_angepinnt
      );
    });
  }

  insArchivVerschieben(frage: any): void {
    this.questionService.archivieren(frage.id, true).subscribe(() => {
      this.entfernenAusListe(frage.id);
    });
  }

  inPapierkorbVerschieben(frage: any): void {
    this.questionService.löschen(frage.id).subscribe(() => {
      this.entfernenAusListe(frage.id);
    });
  }

  markieren(frage: any): void {
    this.questionService.pin(frage.id, true).subscribe(() => {
      this.entfernenAusListe(frage.id);
    });
  }

  private entfernenAusListe(frageId: number): void {
    this.beantworteteFragen = this.beantworteteFragen.filter(f => f.id !== frageId);
  }

  // Navigation back to tutor questions overview
  zurueck(): void {
    this.router.navigate(['/welcome/tutor/questions']);
  }
}


