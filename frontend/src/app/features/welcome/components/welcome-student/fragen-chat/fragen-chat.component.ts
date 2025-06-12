import { Component, OnInit } from '@angular/core';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-fragen-chat',
  templateUrl: './fragen-chat.component.html',
  styleUrls: ['./fragen-chat.component.scss']
})
export class FragenChatComponent implements OnInit {

  // New user message to be sent
  newMessage: string = '';

  // Array of all fetched questions
  questions: Question[] = [];

  constructor(
    private questionService: QuestionService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load questions when component is initialized
    this.loadQuestions();
  }

  // Loads all non-archived and non-deleted questions, sorted by creation date
  loadQuestions() {
    this.questionService.getAll().subscribe(data => {
      this.questions = data
        .filter(q => !q.ist_archiviert && !q.ist_geloescht)
        .sort((a, b) => new Date(a.erstellt_am).getTime() - new Date(b.erstellt_am).getTime());
    });
  }

  // Sends a new question message
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

  // Deletes a specific question
  deleteMessage(question: Question) {
    this.questionService.löschen(question.id).subscribe(() => {
      this.loadQuestions();
    });
  }

  // Navigates back to the start page
  goBack() {
    this.router.navigate(['/welcome/student']);
  }
}
