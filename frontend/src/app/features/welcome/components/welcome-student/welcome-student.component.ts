import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HintService } from 'app/features/welcome/services/hint.service';
import { TodoService, Todo } from 'app/features/welcome/services/todo.service';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';

// Interne Datenstruktur für letzte Nachricht im Fragenforum
interface ChatMessage {
  from: 'student' | 'tutor';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-welcome-student',
  templateUrl: './welcome-student.component.html',
  styleUrls: ['./welcome-student.component.scss'],
})
export class WelcomeStudentComponent implements OnInit {
  todos: Todo[] = [];              // Liste offener Aufgaben
  newTodo = '';                    // Eingabefeld für neue Aufgabe
  hinweise: string[] = [];         // Hinweise vom Tutor
  lastMessage?: ChatMessage;       // Letzte Nachricht im Fragenforum

  constructor(
    private router: Router,
    private hintService: HintService,
    private todoService: TodoService,
    private questionService: QuestionService
  ) {}

  ngOnInit(): void {
    // Hinweise vom Server laden
    this.hintService.getHints().subscribe((hints) => {
      this.hinweise = hints.map(h => h.text);
    });

    // To-dos vom Server laden
    this.todoService.getTodos().subscribe((data) => {
      this.todos = data;
    });

    // Letzte Frage oder Antwort im Forum laden
    this.loadLastMessage();
  }

  /**
   * Neue Aufgabe anlegen (wenn Eingabe nicht leer ist)
   */
  addTodo(): void {
    const trimmed = this.newTodo.trim();
    if (trimmed) {
      this.todoService.addTodo({ text: trimmed, done: false }).subscribe((createdTodo) => {
        this.todos.push(createdTodo);
        this.newTodo = '';
      });
    }
  }

  /**
   * Aufgabe löschen (Index aus Liste + Server löschen)
   */
  removeTodo(index: number): void {
    const todo = this.todos[index];
    this.todoService.deleteTodo(todo.id).subscribe(() => {
      this.todos.splice(index, 1);
    });
  }

  /**
   * Status "erledigt/nicht erledigt" einer Aufgabe ändern
   */
  toggleDone(todo: Todo): void {
    this.todoService.updateTodo(todo).subscribe();
  }

  /**
   * Letzte Nachricht (Frage oder Antwort) aus dem Forum laden
   */
  loadLastMessage(): void {
    this.questionService.getAll().subscribe((data: Question[]) => {
      const chat = data
        .filter(q => !q.ist_archiviert && !q.ist_geloescht)
        .map(q => [
          {
            from: 'student' as const,
            text: q.frage,
            timestamp: new Date(q.erstellt_am),
          },
          ...(q.antwort
            ? [{
                from: 'tutor' as const,
                text: q.antwort,
                timestamp: new Date(q.erstellt_am),
              }]
            : [])
        ])
        .flat();

      // Die letzte chronologische Nachricht anzeigen
      if (chat.length > 0) {
        chat.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        this.lastMessage = chat[chat.length - 1];
      } else {
        this.lastMessage = undefined;
      }
    });
  }

  /**
   * Weiterleitung zum Fragenforum
   */
  goToFragen(): void {
    this.router.navigate(['welcome/student/fragen']);
  }
}
