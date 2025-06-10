import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definition des Todo-Datenmodells
export interface Todo {
  id: number;
  text: string;
  done: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private apiUrl = 'http://localhost:3000/api/todos';

  constructor(private http: HttpClient) {}

  /**
   * Holt die Todos vom Server, abhängig von der Nutzerrolle (student oder tutor)
   * Die Rolle wird lokal aus dem Browser-Speicher ausgelesen.
   */
  getTodos(): Observable<Todo[]> {
    const role = localStorage.getItem('role'); // "student" oder "tutor"
    return this.http.get<Todo[]>(`${this.apiUrl}?role=${role}`);
  }

  /**
   * Sendet ein neues Todo an den Server.
   * Zusätzlich wird die Rolle des Nutzers mitgesendet.
   */
  addTodo(todo: Partial<Todo>): Observable<Todo> {
    const role = localStorage.getItem('role');
    return this.http.post<Todo>(this.apiUrl, { ...todo, role });
  }

  /**
   * Löscht ein bestehendes Todo anhand seiner ID
   */
  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Aktualisiert den Status (done) eines Todos
   */
  updateTodo(todo: Todo): Observable<Todo> {
    return this.http.patch<Todo>(`${this.apiUrl}/${todo.id}`, { done: todo.done });
  }
}
