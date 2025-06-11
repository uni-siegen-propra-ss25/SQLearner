import { Component, OnInit } from '@angular/core';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';
import { Router } from '@angular/router';  

@Component({
  selector: 'app-papierkorb',
  templateUrl: './papierkorb.component.html',
  styleUrls: ['./papierkorb.component.scss'],
})
export class PapierkorbComponent implements OnInit {
  // List of questions moved to trash but not deleted permanently
  fragen: Question[] = [];

constructor(
  private questionService: QuestionService,
  private router: Router  
) {}

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


wiederherstellen(frage: Question): void {
  this.questionService.patchGeloescht(frage.id, false).subscribe(() => {
    this.ladeGeloeschteFragen(); // Always load the bin
  });
}

endgueltigLoeschen(frage: Question): void {
  if (confirm('Diese Frage endgültig löschen?')) {
    this.questionService.hardDelete(frage.id).subscribe(() => {
      this.ladeGeloeschteFragen(); 
    });
  }
}
  zurueck(): void {
    this.router.navigate(['/welcome/tutor/questions']);
  }
}


