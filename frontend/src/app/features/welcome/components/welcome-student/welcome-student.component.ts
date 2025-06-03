import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HinweisService } from 'app/features/welcome/services/hinweis.service'; 

@Component({
  selector: 'app-welcome-student',
  templateUrl: './welcome-student.component.html',
  styleUrls: ['./welcome-student.component.scss']
})
export class WelcomeStudentComponent implements OnInit {
  todos = [
    { text: 'SQL-Übung 1 bearbeiten', done: false },
    { text: 'Video zum JOIN-Thema schauen', done: false }
  ];
  newTodo: string = '';
  questions =  [];

  hinweise: string[] = [];

  constructor(private router: Router, private hinweisService: HinweisService) {}

  ngOnInit() {
    this.hinweise = this.hinweisService.getHinweise();
  }

  addTodo() {
    const trimmed = this.newTodo.trim();
    if (trimmed) {
      this.todos.push({ text: trimmed, done: false });
      this.newTodo = '';
    }
  }

  removeTodo(index: number) {
    this.todos.splice(index, 1);
  }

  goToFragen() {
    this.router.navigate(['/student/fragen']);
  }
}
