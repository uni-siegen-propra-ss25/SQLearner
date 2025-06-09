import { Component, OnInit } from '@angular/core';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';

@Component({
  selector: 'app-fragen-chat',
  templateUrl: './fragen-chat.component.html',
  styleUrls: ['./fragen-chat.component.scss']
})
export class FragenChatComponent implements OnInit {
  newMessage: string = '';
  questions: Question[] = [];

  constructor(private questionService: QuestionService) {}

  ngOnInit() {
    this.loadQuestions();
  }

  loadQuestions() {
    this.questionService.getAll().subscribe(data => {
      this.questions = data
        .filter(q => !q.ist_archiviert && !q.ist_geloescht)
        .sort((a, b) => new Date(a.erstellt_am).getTime() - new Date(b.erstellt_am).getTime());
    });
  }

  sendMessage() {
    const trimmed = this.newMessage.trim();
    if (!trimmed) return;

this.questionService.create({
  student_name: 'Student',
  frage: trimmed
}).subscribe(() => {
  this.newMessage = '';
  this.loadQuestions();
});


  }

  deleteMessage(question: Question) {
    this.questionService.löschen(question.id).subscribe(() => {
      this.loadQuestions();
    });
  }

  handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const fileMessage = `📎 Datei angehängt: ${file.name}`;

this.questionService.create({
  student_name: 'Student',
  frage: fileMessage
}).subscribe(() => {
  this.loadQuestions();
});


    }
  }
}
