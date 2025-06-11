// Import core Angular features and routing service
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Import von Services und Datenmodellen für Hinweise, To-dos und Fragen
import { HintService, Hint } from 'app/features/welcome/services/hint.service';
import { TodoService, Todo } from 'app/features/welcome/services/todo.service';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';

@Component({
  selector: 'app-welcome-tutor',
  templateUrl: './welcome-tutor.component.html',
  styleUrls: ['./welcome-tutor.component.scss'],
})
export class WelcomeTutorComponent implements OnInit {

  // Model for new hint input field
  newHint = '';
  // Array to store all current hints
  hints: Hint[] = [];

  // Model for new todo input field
  newTodo = '';
  // Array to store all current todos
  todos: Todo[] = [];

  // Array to store student questions
  fragen: Question[] = [];

  constructor(
    private router: Router,
    private hintService: HintService,
    private todoService: TodoService,
    private questionService: QuestionService
  ) {}

  // Lifecycle hook: runs when component initializes, loading data from backend
  ngOnInit() {
    this.loadHints();
    this.loadTodos();
    this.loadFragen();
  }

  // Fetch all hints from the backend service and assign to local array
  loadHints() {
    this.hintService.getHints().subscribe((data) => {
      this.hints = data;
    });
  }

  // Fetch all todos from the backend service
  loadTodos() {
    this.todoService.getTodos().subscribe((data) => {
      this.todos = data;
    });
  }

  // Fetch latest student questions from backend service
  loadFragen() {
    this.questionService.getAll().subscribe((fragen: Question[]) => {
    this.fragen = fragen
    .filter(f =>
    !f.ist_archiviert &&
    !f.ist_geloescht &&
    !f.ist_beantwortet &&
    !f.ist_angepinnt
  )
  .sort((a, b) => new Date(b.erstellt_am).getTime() - new Date(a.erstellt_am).getTime());
    });
  }
  // Add a new hint if input is not empty; then reset input and reload list
  addHint() {
    const text = this.newHint.trim();
    if (text) {
      this.hintService.addHint(text).subscribe((hint) => {
        this.hints.push(hint);
        this.newHint = ''; 
      });
    }
  }

  // Remove hint by index from the list, then reload hints from backend
  removeHint(index: number) {
    const id = this.hints[index].id;
    this.hintService.deleteHint(id).subscribe(() => {
      this.hints.splice(index, 1);
    });
  }

    // Add a new todo task if input is not empty; then reset input and reload list
  addTodo() {
    const text = this.newTodo.trim();
    if (text) {
      this.todoService.addTodo({ text, done: false }).subscribe((todo) => {
        this.todos.push(todo);
        this.newTodo = '';
      });
    }
  }

    // Remove todo by index, then reload todo list
  removeTodo(index: number) {
    const id = this.todos[index].id;
    this.todoService.deleteTodo(id).subscribe(() => {
      this.todos.splice(index, 1);
    });
  }

   // Toggle done status of a todo item and update it via service
  toggleDone(todo: Todo) {
    this.todoService.updateTodo(todo).subscribe();
  }

    // Navigate to the full questions list page
  goToFragen() {
    this.router.navigate(['welcome/tutor/questions']);
  }
}
