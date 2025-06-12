import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Data model representing a Todo item.
 */
export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

@Injectable({
  providedIn: 'root'
})
/**
 * Service to manage Todo items.
 * Handles retrieving, creating, updating, and deleting todos.
 */
export class TodoService {
  private apiUrl = 'http://localhost:3000/api/todos';

  constructor(private http: HttpClient) {}

  /**
   * Retrieves todos from the server based on user role.
   * @returns Observable of an array of Todo items.
   */
  getTodos(): Observable<Todo[]> {
    const role = localStorage.getItem('role'); // "student" or "tutor"
    return this.http.get<Todo[]>(`${this.apiUrl}?role=${role}`);
  }

  /**
   * Adds a new todo to the server.
   * Includes the user's role.
   * @param todo Partial Todo object.
   * @returns Observable of the created Todo.
   */
  addTodo(todo: Partial<Todo>): Observable<Todo> {
    const role = localStorage.getItem('role');
    return this.http.post<Todo>(this.apiUrl, { ...todo, role });
  }

  /**
   * Deletes a todo by its ID.
   * @param id ID of the todo to delete.
   * @returns Observable<void>
   */
  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Updates the completion status of a todo.
   * @param todo Todo object with updated `done` field.
   * @returns Observable of the updated Todo.
   */
  updateTodo(todo: Todo): Observable<Todo> {
    return this.http.patch<Todo>(`${this.apiUrl}/${todo.id}`, { done: todo.done });
  }
}
