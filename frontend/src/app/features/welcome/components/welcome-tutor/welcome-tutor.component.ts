import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HintService, Hint } from 'app/features/welcome/services/hint.service';
import { TodoService, Todo } from 'app/features/welcome/services/todo.service';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';

@Component({
  selector: 'app-welcome-tutor',
  templateUrl: './welcome-tutor.component.html',
  styleUrls: ['./welcome-tutor.component.scss'],
})
export class WelcomeTutorComponent implements OnInit {
  newHint = '';
  hints: Hint[] = [];

  todos: Todo[] = [];
  newTodo = '';
  fragen: Question[] = [];

  constructor(
    private router: Router,
    private hintService: HintService,
    private todoService: TodoService,
    private questionService: QuestionService
  ) {}

  ngOnInit() {
    this.loadHints();
    this.loadTodos();
    this.loadFragen();
  }

  loadHints() {
    this.hintService.getHints().subscribe((data) => {
      this.hints = data;
    });
  }

  loadTodos() {
    this.todoService.getTodos().subscribe((data) => {
      this.todos = data;
    });
  }

  loadFragen() {
    this.questionService.getAll().subscribe((fragen: Question[]) => {
      this.fragen = fragen
        .filter(f => !f.ist_archiviert && !f.ist_geloescht)
        .sort((a, b) => new Date(b.erstellt_am).getTime() - new Date(a.erstellt_am).getTime());
    });
  }

  addHint() {
    const text = this.newHint.trim();
    if (text) {
      this.hintService.addHint(text).subscribe((hint) => {
        this.hints.push(hint);
        this.newHint = '';
      });
    }
  }

  removeHint(index: number) {
    const id = this.hints[index].id;
    this.hintService.deleteHint(id).subscribe(() => {
      this.hints.splice(index, 1);
    });
  }

  addTodo() {
    const text = this.newTodo.trim();
    if (text) {
      this.todoService.addTodo({ text, done: false }).subscribe((todo) => {
        this.todos.push(todo);
        this.newTodo = '';
      });
    }
  }

  removeTodo(index: number) {
    const id = this.todos[index].id;
    this.todoService.deleteTodo(id).subscribe(() => {
      this.todos.splice(index, 1);
    });
  }

  toggleDone(todo: Todo) {
    this.todoService.updateTodo(todo).subscribe();
  }

  goToFragen() {
    this.router.navigate(['welcome/tutor/questions']);
  }
}
