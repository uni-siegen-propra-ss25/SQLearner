// Import grundlegender Angular-Funktionalitäten und Services
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

  // Neueingabe für Hinweis
  newHint = '';
  // Liste aller Hinweise
  hints: Hint[] = [];

  // Neueingabe für To-do
  newTodo = '';
  // Liste aller To-dos
  todos: Todo[] = [];

  // Fragenliste der Studierenden
  fragen: Question[] = [];

  constructor(
    private router: Router,
    private hintService: HintService,
    private todoService: TodoService,
    private questionService: QuestionService
  ) {}

  // Beim Laden der Komponente werden Daten geholt
  ngOnInit() {
    this.loadHints();
    this.loadTodos();
    this.loadFragen();
  }

  // Lädt Hinweise aus dem Backend
  loadHints() {
    this.hintService.getHints().subscribe((data) => {
      this.hints = data;
    });
  }

  // Lädt To-dos aus dem Backend
  loadTodos() {
    this.todoService.getTodos().subscribe((data) => {
      this.todos = data;
    });
  }

  // Lädt Fragen, filtert archivierte oder gelöschte aus und sortiert nach Erstellungsdatum
  loadFragen() {
    this.questionService.getAll().subscribe((fragen: Question[]) => {
      this.fragen = fragen
        .filter(f => !f.ist_archiviert && !f.ist_geloescht)
        .sort((a, b) => new Date(b.erstellt_am).getTime() - new Date(a.erstellt_am).getTime());
    });
  }

  // Fügt einen neuen Hinweis hinzu (wenn nicht leer)
  addHint() {
    const text = this.newHint.trim();
    if (text) {
      this.hintService.addHint(text).subscribe((hint) => {
        this.hints.push(hint);
        this.newHint = ''; // Eingabefeld zurücksetzen
      });
    }
  }

  // Entfernt einen Hinweis per Index
  removeHint(index: number) {
    const id = this.hints[index].id;
    this.hintService.deleteHint(id).subscribe(() => {
      this.hints.splice(index, 1);
    });
  }

  // Fügt ein neues To-do hinzu (wenn nicht leer)
  addTodo() {
    const text = this.newTodo.trim();
    if (text) {
      this.todoService.addTodo({ text, done: false }).subscribe((todo) => {
        this.todos.push(todo);
        this.newTodo = '';
      });
    }
  }

  // Entfernt ein To-do per Index
  removeTodo(index: number) {
    const id = this.todos[index].id;
    this.todoService.deleteTodo(id).subscribe(() => {
      this.todos.splice(index, 1);
    });
  }

  // Aktualisiert den "done"-Status eines To-dos
  toggleDone(todo: Todo) {
    this.todoService.updateTodo(todo).subscribe();
  }

  // Navigiert zur Detailansicht der Fragen
  goToFragen() {
    this.router.navigate(['welcome/tutor/questions']);
  }
}
