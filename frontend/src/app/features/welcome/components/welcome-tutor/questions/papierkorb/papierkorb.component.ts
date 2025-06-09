import { Component, OnInit } from '@angular/core';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';

@Component({
  selector: 'app-papierkorb',
  templateUrl: './papierkorb.component.html',
  styleUrls: ['./papierkorb.component.scss'],
})
export class PapierkorbComponent implements OnInit {
  fragen: Question[] = [];

  constructor(private questionService: QuestionService) {}

  ngOnInit(): void {
    this.ladeGeloeschteFragen();
  }

  ladeGeloeschteFragen(): void {
    this.questionService.getAll().subscribe(data => {
      this.fragen = data.filter(q => q.ist_geloescht);
    });
  }

  wiederherstellen(frage: Question): void {
    this.questionService.patchGeloescht(frage.id, false).subscribe(() => {
      this.ladeGeloeschteFragen();
    });
  }

  endgueltigLoeschen(frage: Question): void {
    if (confirm('Diese Frage endgültig löschen?')) {
      this.questionService.hardDelete(frage.id).subscribe(() => {
        this.ladeGeloeschteFragen();
      });
    }
  }
}



