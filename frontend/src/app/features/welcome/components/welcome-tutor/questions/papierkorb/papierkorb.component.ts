import { Component, OnInit } from '@angular/core';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';
import { Router } from '@angular/router';  // <-- Router importieren

@Component({
  selector: 'app-papierkorb',
  templateUrl: './papierkorb.component.html',
  styleUrls: ['./papierkorb.component.scss'],
})
export class PapierkorbComponent implements OnInit {
  fragen: Question[] = [];

constructor(
  private questionService: QuestionService,
  private router: Router  // Router hier injizieren
) {}
// Beim Initialisieren gelöschte Fragen laden
ngOnInit() {
  this.questionService.getGeloeschte().subscribe((data) => {
    this.fragen = data;
  });
}


ladeGeloeschteFragen(): void {
  this.questionService.getGeloeschte().subscribe(data => {
    this.fragen = data;
  });
}


  // Stellt eine gelöschte Frage wieder her
wiederherstellen(frage: Question): void {
  this.questionService.patchGeloescht(frage.id, false).subscribe(() => {
    this.ladeGeloeschteFragen(); // Nach dem Wiederherstellen neu laden
  });
}

endgueltigLoeschen(frage: Question): void {
  if (confirm('Diese Frage endgültig löschen?')) {
    this.questionService.hardDelete(frage.id).subscribe(() => {
      this.ladeGeloeschteFragen(); // Nach dem endgültigen Löschen neu laden
    });
  }
}
  zurueck(): void {
    this.router.navigate(['/welcome/tutor/questions']);
  }
}


