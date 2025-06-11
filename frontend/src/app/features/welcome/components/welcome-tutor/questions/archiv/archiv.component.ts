import { Component, OnInit } from '@angular/core';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';
import { Router } from '@angular/router';  // <-- Import Router for navigation

@Component({
  selector: 'app-archiv',
  templateUrl: './archiv.component.html',
  styleUrls: ['./archiv.component.scss'],
})
export class ArchivComponent implements OnInit {
  // List of archived but not deleted questions
  fragen: Question[] = [];
  
  constructor(
    private questionService: QuestionService,
    private router: Router  // Inject Router here
  ) {}

  ngOnInit(): void {
    // On component initialization: load archived questions
    this.ladeArchivierteFragen();
  }

  ladeArchivierteFragen(): void {
    // API call: Get only questions that are archived and not deleted
    this.questionService.getAll().subscribe(data => {
      this.fragen = data.filter(q => q.ist_archiviert && !q.ist_geloescht);
    });
  }

  // Restore a question from the archive
  wiederherstellen(frage: Question): void {
    this.questionService.archivieren(frage.id, false).subscribe(() => {
      this.ladeArchivierteFragen();
    });
  }

inPapierkorbVerschieben(frage: Question): void {
  this.questionService.patchGeloescht(frage.id, true).subscribe(() => {
    this.ladeArchivierteFragen();
  });
}


  // Method for the Back button navigation
  zurueck(): void {
    this.router.navigate(['/welcome/tutor/questions']);
  }
}



