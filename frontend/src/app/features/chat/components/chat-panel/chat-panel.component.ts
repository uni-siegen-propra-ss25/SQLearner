import { Component, ElementRef, Input, OnDestroy, OnInit, Output, EventEmitter, ViewChild, AfterViewChecked } from '@angular/core';
import { Message } from '../../models/chat.model';
import { ChatService } from '../../services/chat.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
    selector: 'app-chat-panel',
    templateUrl: './chat-panel.component.html',
    styleUrls: ['./chat-panel.component.scss']
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
    @Input() context?: string;
    @Output() close = new EventEmitter<void>();
    @ViewChild('messageContainer') private messageContainer!: ElementRef;
    
    newMessage = '';
    isLoading = false;
    error: string | null = null;
    private subscriptions = new Subscription();
    private shouldScroll = false;

    constructor(
        private readonly chatService: ChatService,
        private readonly snackBar: MatSnackBar
    ) {}

    get messages$() {
        return this.chatService.messages$;
    }

    ngOnInit() {
        // Start with a fresh chat for each exercise
        this.chatService.clearChat();
        // Load messages for current exercise context
        if (this.context) {
            this.loadMessages();
        }
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    ngAfterViewChecked() {
        if (this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    private loadMessages() {
        this.isLoading = true;
        this.subscriptions.add(
            this.chatService.getMessages(this.context).subscribe({
                next: () => {
                    this.isLoading = false;
                    this.shouldScroll = true;
                },
                error: (error: HttpErrorResponse) => {
                    console.error('Error loading messages:', error);
                    this.isLoading = false;
                    this.error = 'Failed to load messages';
                    this.showError('Failed to load messages');
                }
            })
        );
    }

    sendMessage() {
        const trimmedMessage = this.newMessage.trim();
        if (!trimmedMessage) return;

        const tempMessage: Message = {
            id: Date.now(),
            content: trimmedMessage,
            sender: 'user',
            context: this.context,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.chatService.addMessage(tempMessage);
        this.isLoading = true;
        this.newMessage = '';
        this.shouldScroll = true;

        this.subscriptions.add(
            this.chatService.sendMessage(trimmedMessage, this.context).subscribe({
                next: (response) => {
                    this.chatService.addMessage(response);
                    this.isLoading = false;
                    this.shouldScroll = true;
                },
                error: (error: HttpErrorResponse) => {
                    console.error('Error sending message:', error);
                    this.isLoading = false;
                    this.showError('Failed to send message');
                }
            })
        );
    }

    onClose() {
        this.close.emit();
    }

    private scrollToBottom() {
        try {
            const element = this.messageContainer.nativeElement;
            element.scrollTop = element.scrollHeight;
        } catch (err) {
            console.error('Error scrolling to bottom:', err);
        }
    }

    private showError(message: string) {
        this.snackBar.open(message, 'Close', {
            duration: 3000,
            panelClass: ['mat-toolbar', 'mat-warn']
        });
    }
}
