import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HintService } from 'app/features/welcome/services/hint.service';
import { TodoService, Todo } from 'app/features/welcome/services/todo.service';
import { QuestionService, Question } from 'app/features/welcome/services/question.service';

/**
 * Chat message interface used to represent a student or tutor message.
 */
interface ChatMessage {
  from: 'student' | 'tutor';
  text: string;
  timestamp: Date;
}

/**
 * Component for the welcome page shown to students.
 * Displays tutor hints, to-do list, and the latest forum message.
 */
@Component({
  selector: 'app-welcome-student',
  templateUrl: './welcome-student.component.html',
  styleUrls: ['./welcome-student.component.scss'],
})
export class WelcomeStudentComponent implements OnInit {
  /**
   * List of current to-dos for the student.
   */
  todos: Todo[] = [];

  /**
   * The value of the new to-do input field.
   */
  newTodo = '';

  /**
   * List of hints provided by the tutor.
   */
  hinweise: string[] = [];

  /**
   * Most recent question or answer message from the forum.
   */
  lastMessage?: ChatMessage;

  /**
   * Creates component and injects required services.
   * @param router Angular router for navigation
   * @param hintService Service to fetch tutor hints
   * @param todoService Service to manage to-do items
   * @param questionService Service to fetch forum questions
   */
  constructor(
    private router: Router,
    private hintService: HintService,
    private todoService: TodoService,
    private questionService: QuestionService
  ) {}

  /**
   * Lifecycle method called once after component initialization.
   * Loads hints, todos, and latest forum message.
   */
  ngOnInit(): void {
    // Load hints from the server
    this.hintService.getHints().subscribe((hints) => {
      this.hinweise = hints.map(h => h.text);
    });

    // Load to-dos from the server
    this.todoService.getTodos().subscribe((data) => {
      this.todos = data;
    });

    // Load the latest chat message from forum (question/answer)
    this.loadLastMessage();
  }

  /**
   * Adds a new to-do item to the list.
   * Only works if the input is not empty after trimming.
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
   * Removes a to-do item by its index.
   * Also deletes the item from the server.
   * @param index Index of the to-do in the list
   */
  removeTodo(index: number): void {
    const todo = this.todos[index];
    this.todoService.deleteTodo(todo.id).subscribe(() => {
      this.todos.splice(index, 1);
    });
  }

  /**
   * Toggles the 'done' state of a to-do item and updates it on the server.
   * @param todo To-do item to update
   */
  toggleDone(todo: Todo): void {
    this.todoService.updateTodo(todo).subscribe();
  }

  /**
   * Loads the most recent student or tutor message from the forum.
   * Filters out archived or deleted questions and maps to chat messages.
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

      if (chat.length > 0) {
        chat.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        this.lastMessage = chat[chat.length - 1];
      } else {
        this.lastMessage = undefined;
      }
    });
  }

  /**
   * Navigates the user to the forum page to ask a new question.
   */
  goToFragen(): void {
    this.router.navigate(['welcome/student/questions']);
  }
}
