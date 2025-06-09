import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HintService } from 'app/features/welcome/services/hint.service';
import { TodoService, Todo } from 'app/features/welcome/services/todo.service';

@Component({
  selector: 'app-welcome-student',
  templateUrl: './welcome-student.component.html',
  styleUrls: ['./welcome-student.component.scss'],
})
export class WelcomeStudentComponent implements OnInit {
  todos: Todo[] = [];
  newTodo = '';
  hinweise: string[] = [];

  constructor(
    private router: Router,
    private hintService: HintService,
    private todoService: TodoService
  ) {}

  ngOnInit(): void {
    // Holt Hinweise vom Server
    this.hintService.getHints().subscribe((hints) => {
      this.hinweise = hints.map(h => h.text); // Annahme: Hint hat 'text'
    });

    this.todoService.getTodos().subscribe((data) => {
      this.todos = data;
    });
  }

  addTodo(): void {
    const trimmed = this.newTodo.trim();
    if (trimmed) {
      this.todoService.addTodo({ text: trimmed, done: false }).subscribe((createdTodo) => {
        this.todos.push(createdTodo);
        this.newTodo = '';
      });
    }
  }

  removeTodo(index: number): void {
    const todo = this.todos[index];
    this.todoService.deleteTodo(todo.id).subscribe(() => {
      this.todos.splice(index, 1);
    });
  }

  toggleDone(todo: Todo): void {
    this.todoService.updateTodo(todo).subscribe();
  }

  lastMessage = {
    from: 'tutor',
    text: 'Für diese Aufgabe nicht. Es wäre aber nicht verkehrt für die Klausur beide Varianten zu lernen',
    timestamp: new Date(),
  };

  goToFragen(): void {
    this.router.navigate(['welcome/student/fragen']);
  }
}

