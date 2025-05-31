import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Message } from '../models/chat.model';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private messagesSubject = new BehaviorSubject<Message[]>([]);
    messages$ = this.messagesSubject.asObservable();
    
    constructor(private http: HttpClient) {}

    getMessages(context?: string): Observable<Message[]> {
        const url = '/api/chat' + (context ? `?context=${encodeURIComponent(context)}` : '');
        return this.http.get<Message[]>(url).pipe(
            tap(messages => this.messagesSubject.next(messages))
        );
    }

    sendMessage(content: string, context?: string | undefined): Observable<Message> {
        return this.http.post<Message>('/api/chat', {
            content,
            context
        });
    }

    addMessage(message: Message) {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next([...currentMessages, message]);
    }

    clearChat() {
        this.messagesSubject.next([]);
    }
}
