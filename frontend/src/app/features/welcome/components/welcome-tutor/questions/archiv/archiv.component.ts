import { Component, OnInit } from '@angular/core';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';
import { Router } from '@angular/router';  // <-- Router importieren

@Component({
  selector: 'app-archiv',
  templateUrl: './archiv.component.html',
  styleUrls: ['./archiv.component.scss'],
})
export class ArchivComponent implements OnInit {
  // Liste archivierter, aber nicht gelöschter Fragen
  fragen: Question[] = [];
  
constructor(
  private questionService: QuestionService,
  private router: Router  // Router hier injizieren
) {}

  ngOnInit(): void {
    // Beim Start: Lade archivierte Fragen
    this.ladeArchivierteFragen();
  }

  ladeArchivierteFragen(): void {
    // API-Aufruf: Nur Fragen, die archiviert und nicht gelöscht sind
    this.questionService.getAll().subscribe(data => {
      this.fragen = data.filter(q => q.ist_archiviert && !q.ist_geloescht);
    });
  }

  // Stellt Frage aus dem Archiv wieder her
  wiederherstellen(frage: Question): void {
    this.questionService.archivieren(frage.id, false).subscribe(() => {
      this.ladeArchivierteFragen();
    });
  }

  // Löscht Frage endgültig (mit Bestätigung)
  endgueltigLoeschen(frage: Question): void {
    if (confirm('Diese Frage endgültig löschen?')) {
      this.questionService.löschen(frage.id).subscribe(() => {
        this.ladeArchivierteFragen();
      });
    }
  }
    // Neue Methode für Zurück-Button
  zurueck(): void {
    this.router.navigate(['/welcome/tutor/questions']);
  }
}



