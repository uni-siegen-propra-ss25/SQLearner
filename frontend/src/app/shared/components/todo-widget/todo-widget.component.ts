import { Component, Input, OnInit } from '@angular/core';
import { TodoService, Todo, CreateTodoDto } from '../../services/todo.service';

/**
 * Todo Widget Component for displaying and managing user todos.
 * Simple todo list where items are completed by deleting them.
 */
@Component({
    selector: 'app-todo-widget',
    templateUrl: './todo-widget.component.html',
    styleUrls: ['./todo-widget.component.scss'],
})
export class TodoWidgetComponent implements OnInit {
    /** Whether the current user has admin privileges for managing todos */
    @Input() isAdmin = false;
    
    /** Array of todo items */
    todos: Todo[] = [];
    
    /** Title for new todo */
    newTodo = '';

    constructor(private todoService: TodoService) {}

    ngOnInit(): void {
        this.loadTodos();
    }

    /**
     * Loads all todos from the service
     */
    loadTodos(): void {
        this.todoService.getTodos().subscribe((todos) => {
            this.todos = todos;
        });
    }

    /**
     * Adds a new todo item to the list
     */
    addTodo(): void {
        const title = this.newTodo.trim();
        if (title) {
            const createDto: CreateTodoDto = {
                title,
            };
            
            this.todoService.addTodo(createDto).subscribe((todo) => {
                this.todos.push(todo);
                this.newTodo = '';
            });
        }
    }

    /**
     * Removes a todo item from the list (completion by deletion)
     * @param index Index of the todo to remove
     */
    removeTodo(index: number): void {
        const todo = this.todos[index];
        if (todo.id) {
            this.todoService.deleteTodo(todo.id).subscribe(() => {
                this.todos.splice(index, 1);
            });
        }
    }
}
