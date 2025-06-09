import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  getTodos(): Observable<Todo[]> {
    const role = localStorage.getItem('role'); // "student" oder "tutor"
    return this.http.get<Todo[]>(`${this.apiUrl}?role=${role}`);
  }

  addTodo(todo: Partial<Todo>): Observable<Todo> {
    const role = localStorage.getItem('role');
    return this.http.post<Todo>(this.apiUrl, { ...todo, role });
  }

  deleteTodo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateTodo(todo: Todo): Observable<Todo> {
    return this.http.patch<Todo>(`${this.apiUrl}/${todo.id}`, { done: todo.done });
  }
}
