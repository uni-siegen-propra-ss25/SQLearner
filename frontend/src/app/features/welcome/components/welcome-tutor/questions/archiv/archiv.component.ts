import { Component, OnInit } from '@angular/core';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';

@Component({
  selector: 'app-archiv',
  templateUrl: './archiv.component.html',
  styleUrls: ['./archiv.component.scss'],
})
export class ArchivComponent implements OnInit {
  fragen: Question[] = [];

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    this.ladeArchivierteFragen();
  }

  ladeArchivierteFragen(): void {
    this.questionService.getAll().subscribe(data => {
      this.fragen = data.filter(q => q.ist_archiviert && !q.ist_geloescht);
    });
  }

  wiederherstellen(frage: Question): void {
    this.questionService.archivieren(frage.id, false).subscribe(() => {
      this.ladeArchivierteFragen();
    });
  }

  endgueltigLoeschen(frage: Question): void {
    if (confirm('Diese Frage endgültig löschen?')) {
      this.questionService.löschen(frage.id).subscribe(() => {
        this.ladeArchivierteFragen();
      });
    }
  }
}


