import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Data model representing a Todo item.
 */
export interface Todo {
    id?: number;
    title: string;
    description?: string | null;
    completed: boolean;
    dueDate?: Date | null;
    priority: number;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * DTO for creating a new todo item
 */
export interface CreateTodoDto {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: number;
}

/**
 * DTO for updating an existing todo item
 */
export interface UpdateTodoDto {
    title?: string;
    description?: string;
    completed?: boolean;
    dueDate?: string;
    priority?: number;
}

@Injectable({
    providedIn: 'root',
})
/**
 * Service to manage Todo items.
 * Handles retrieving, creating, updating, and deleting todos.
 */
export class TodoService {
    private apiUrl = 'http://localhost:3000/api/todos';

    constructor(private http: HttpClient) {}

    /**
     * Retrieves all todos for the current user.
     * @returns Observable of an array of Todo items.
     */
    getTodos(): Observable<Todo[]> {
        return this.http.get<Todo[]>(this.apiUrl);
    }

    /**
     * Gets a specific todo by ID.
     * @param id Todo ID
     * @returns Observable of the Todo.
     */
    getTodo(id: number): Observable<Todo> {
        return this.http.get<Todo>(`${this.apiUrl}/${id}`);
    }

    /**
     * Adds a new todo.
     * @param todo CreateTodoDto object.
     * @returns Observable of the created Todo.
     */
    addTodo(todo: CreateTodoDto): Observable<Todo> {
        return this.http.post<Todo>(this.apiUrl, todo);
    }

    /**
     * Updates a todo.
     * @param id Todo ID
     * @param todo UpdateTodoDto object with updated fields.
     * @returns Observable of the updated Todo.
     */
    updateTodo(id: number, todo: UpdateTodoDto): Observable<Todo> {
        return this.http.patch<Todo>(`${this.apiUrl}/${id}`, todo);
    }

    /**
     * Toggles the completion status of a todo.
     * @param id Todo ID
     * @returns Observable of the updated Todo.
     */
    toggleTodo(id: number): Observable<Todo> {
        return this.http.patch<Todo>(`${this.apiUrl}/${id}/toggle`, {});
    }

    /**
     * Deletes a todo by its ID.
     * @param id ID of the todo to delete.
     * @returns Observable<void>
     */
    deleteTodo(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
