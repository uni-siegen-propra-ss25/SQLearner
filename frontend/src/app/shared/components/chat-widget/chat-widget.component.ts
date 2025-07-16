import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DiscussionService, DiscussionThread, DiscussionComment, CreateThreadDto, CreateCommentDto, BackendThreadResponse } from '../../services/discussion.service';
import { Role } from '../../../features/users/models/role.model';
import { Subject, takeUntil } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

/**
 * Interface representing a chat message for the UI
 */
interface ChatMessage {
    id: number;
    type: 'student' | 'tutor' | 'admin';
    authorName: string;
    text: string;
    timestamp: Date;
    isThreadCreator?: boolean;
}

/**
 * Chat widget component that allows users to create discussion threads
 * and add comments. Supports role-based permissions and thread resolution.
 */
@Component({
    selector: 'app-chat-widget',
    templateUrl: './chat-widget.component.html',
    styleUrls: ['./chat-widget.component.scss'],
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
    /** Current user's role */
    @Input() userRole?: Role = Role.STUDENT;
    
    /** Current user's name */
    @Input() userName: string = 'Anonymous';
    
    /** Current user's ID */
    @Input() userId: number = 0;

    /** Array of chat messages to display */
    chatMessages: ChatMessage[] = [];
    
    /** New chat message text */
    newChatMessage = '';
    
    /** Whether the chat is expanded */
    isChatExpanded = false;
    
    /** Available discussion threads */
    discussionThreads: DiscussionThread[] = [];
    
    /** Currently selected thread */
    selectedThread: DiscussionThread | null = null;
    
    /** Whether to show thread creation form */
    showCreateThread = false;
    
    /** New thread title */
    newThreadTitle = '';
    
    /** New thread description */
    newThreadDescription = '';
    
    /** Array of locally created thread IDs for permission tracking */
    private locallyCreatedThreads: Set<number> = new Set();

    /** Subject for handling component destruction */
    private destroy$ = new Subject<void>();

    constructor(private discussionService: DiscussionService, private translate: TranslateService) {}

    ngOnInit(): void {
        this.loadDiscussionThreads();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Loads all available discussion threads from the service
     */
    loadDiscussionThreads(): void {
        this.discussionService.getThreads()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (backendThreads: BackendThreadResponse[]) => {
                    // Map backend data to frontend format
                    this.discussionThreads = backendThreads.map(thread => ({
                        id: thread.id,
                        title: thread.title,
                        description: thread.description,
                        createdBy: thread.author?.id || thread.authorId || 0,
                        createdByRole: thread.author?.role || Role.STUDENT,
                        createdByName: thread.author 
                            ? `${thread.author.firstName || ''} ${thread.author.lastName || ''}`.trim() || 'Unknown User'
                            : 'Unknown User',
                        commentsCount: thread._count?.comments || 0,
                        isResolved: thread.isResolved,
                        isPinned: thread.isPinned,
                        createdAt: new Date(thread.createdAt),
                        updatedAt: new Date(thread.updatedAt)
                    } as DiscussionThread));
                    
                    // Don't auto-select thread for Stack Overflow style
                    // User will select manually from the list
                },
                error: (error) => {
                    console.error('Error loading discussion threads:', error);
                    // Show user-friendly message or fallback
                    this.discussionThreads = [];
                }
            });
    }

    /**
     * Selects a discussion thread and loads its comments
     * @param thread The thread to select
     */
    selectThread(thread: DiscussionThread | null): void {
        if (!thread) {
            this.selectedThread = null;
            this.chatMessages = [];
            return;
        }
        
        // Ensure thread has valid data
        this.selectedThread = {
            ...thread,
            createdByRole: thread.createdByRole || Role.STUDENT,
            createdByName: thread.createdByName || 'Unknown User'
        };
        
        this.loadThreadComments(thread.id);
    }

    /**
     * Loads comments for the selected thread
     * @param threadId ID of the thread to load comments for
     */
    loadThreadComments(threadId: number): void {
        this.discussionService.getComments(threadId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (comments) => {
                    this.chatMessages = this.convertCommentsToMessages(comments);
                    
                    // Update the comments count for the selected thread
                    if (this.selectedThread) {
                        this.selectedThread.commentsCount = comments.length;
                        
                        // Update the thread in the discussionThreads array as well
                        const threadIndex = this.discussionThreads.findIndex(t => t.id === this.selectedThread!.id);
                        if (threadIndex !== -1) {
                            this.discussionThreads[threadIndex].commentsCount = comments.length;
                        }
                    }
                },
                error: (error) => {
                    console.error('Error loading thread comments:', error);
                }
            });
    }

    /**
     * Converts DiscussionComment objects to ChatMessage objects for UI display
     * @param comments Array of discussion comments
     * @returns Array of chat messages
     */
    private convertCommentsToMessages(comments: DiscussionComment[]): ChatMessage[] {
        return comments.map(comment => ({
            id: comment.id,
            type: this.getRoleDisplayName(comment.authorRole || Role.STUDENT),
            authorName: comment.authorName || 'Unknown User',
            text: comment.content || '',
            timestamp: new Date(comment.createdAt),
            isThreadCreator: this.selectedThread ? comment.authorId === this.selectedThread.createdBy : false
        }));
    }

    /**
     * Converts Role enum to display string
     * @param role The role to convert
     * @returns Display string for the role
     */
    private getRoleDisplayName(role: Role): 'student' | 'tutor' | 'admin' {
        if (!role) return 'student';
        
        switch (role) {
            case Role.TUTOR:
                return 'tutor';
            case Role.ADMIN:
                return 'admin';
            default:
                return 'student';
        }
    }

    /**
     * Sends a new chat message to the selected thread
     */
    sendChatMessage(): void {
        const message = this.newChatMessage.trim();
        if (!message || !this.selectedThread) {
            return;
        }

        const commentDto: CreateCommentDto = {
            content: message
        };

        this.discussionService.addComment(this.selectedThread.id, commentDto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (comment) => {
                    // Add the new message to the chat
                    const newMessage: ChatMessage = {
                        id: comment.id,
                        type: this.getRoleDisplayName(comment.authorRole || this.userRole || Role.STUDENT),
                        authorName: comment.authorName || this.userName,
                        text: comment.content,
                        timestamp: new Date(comment.createdAt),
                        isThreadCreator: comment.authorId === this.selectedThread!.createdBy
                    };
                    
                    this.chatMessages.push(newMessage);
                    
                    // Update the comments count in the thread
                    if (this.selectedThread) {
                        this.selectedThread.commentsCount = (this.selectedThread.commentsCount || 0) + 1;
                        
                        // Update the thread in the discussionThreads array as well
                        const threadIndex = this.discussionThreads.findIndex(t => t.id === this.selectedThread!.id);
                        if (threadIndex !== -1) {
                            this.discussionThreads[threadIndex].commentsCount = this.selectedThread.commentsCount;
                        }
                    }
                    
                    this.newChatMessage = '';
                },
                error: (error) => {
                    console.error('Error sending message:', error);
                }
            });
    }

    /**
     * Toggles the chat widget expansion state
     */
    toggleChat(): void {
        this.isChatExpanded = !this.isChatExpanded;
    }

    /**
     * Shows the create thread form
     */
    showCreateThreadForm(): void {
        this.showCreateThread = true;
    }

    /**
     * Hides the create thread form and resets form data
     */
    hideCreateThreadForm(): void {
        this.showCreateThread = false;
        this.newThreadTitle = '';
        this.newThreadDescription = '';
    }

    /**
     * Creates a new discussion thread
     */
    createNewThread(): void {
        if (!this.newThreadTitle.trim() || !this.newThreadDescription.trim()) {
            return;
        }

        const threadDto: CreateThreadDto = {
            title: this.newThreadTitle.trim(),
            description: this.newThreadDescription.trim()
        };

        this.discussionService.createThread(threadDto)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (backendThread: BackendThreadResponse) => {
                    // Map backend response to frontend format
                    const newThread: DiscussionThread = {
                        id: backendThread.id,
                        title: backendThread.title,
                        description: backendThread.description,
                        createdBy: backendThread.author?.id || this.userId,
                        createdByName: backendThread.author 
                            ? `${backendThread.author.firstName || ''} ${backendThread.author.lastName || ''}`.trim() || this.userName
                            : this.userName,
                        createdByRole: backendThread.author?.role || this.userRole || Role.STUDENT,
                        commentsCount: 0,
                        isResolved: backendThread.isResolved,
                        isPinned: backendThread.isPinned,
                        createdAt: new Date(backendThread.createdAt),
                        updatedAt: new Date(backendThread.updatedAt)
                    };
                    
                    // Track locally created thread
                    this.locallyCreatedThreads.add(newThread.id);
                    
                    this.discussionThreads.unshift(newThread);
                    this.selectThread(newThread);
                    this.hideCreateThreadForm();
                },
                error: (error) => {
                    console.error('Error creating thread:', error);
                }
            });
    }

    /**
     * Marks a thread as resolved (either selected thread or specific thread from list)
     * @param thread Optional specific thread to mark as resolved. If not provided, uses selectedThread
     */
    markThreadAsResolved(thread?: DiscussionThread): void {
        const threadToResolve = thread || this.selectedThread;
        
        if (!threadToResolve || !this.canResolveThread(threadToResolve)) {
            return;
        }

        this.discussionService.markThreadAsResolved(threadToResolve.id, true)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (backendThread: BackendThreadResponse) => {
                    // Map backend response to frontend format
                    const updatedThread: DiscussionThread = {
                        id: backendThread.id,
                        title: backendThread.title,
                        description: backendThread.description,
                        createdBy: backendThread.author?.id || backendThread.authorId || 0,
                        createdByRole: backendThread.author?.role || Role.STUDENT,
                        createdByName: backendThread.author 
                            ? `${backendThread.author.firstName || ''} ${backendThread.author.lastName || ''}`.trim() || 'Unknown User'
                            : 'Unknown User',
                        commentsCount: backendThread._count?.comments || threadToResolve.commentsCount || 0,
                        isResolved: backendThread.isResolved,
                        isPinned: backendThread.isPinned,
                        createdAt: new Date(backendThread.createdAt),
                        updatedAt: new Date(backendThread.updatedAt)
                    };
                    
                    // Update the thread in the list
                    const index = this.discussionThreads.findIndex(t => t.id === updatedThread.id);
                    if (index !== -1) {
                        this.discussionThreads[index] = updatedThread;
                    }
                    
                    // Update selected thread if it's the same
                    if (this.selectedThread?.id === updatedThread.id) {
                        this.selectedThread = updatedThread;
                    }
                },
                error: (error) => {
                    console.error('Error resolving thread:', error);
                    alert('Fehler beim Markieren als gelöst: ' + (error.error?.message || error.message || 'Unbekannter Fehler'));
                }
            });
    }

    /**
     * Toggles thread pin status (only for tutors/admins)
     */
    toggleThreadPin(): void {
        if (!this.selectedThread || !this.canPinThread()) {
            return;
        }

        this.discussionService.toggleThreadPin(this.selectedThread.id, !this.selectedThread.isPinned)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (backendThread: BackendThreadResponse) => {
                    // Map backend response to frontend format
                    const updatedThread: DiscussionThread = {
                        id: backendThread.id,
                        title: backendThread.title,
                        description: backendThread.description,
                        createdBy: backendThread.author?.id || backendThread.authorId || 0,
                        createdByRole: backendThread.author?.role || Role.STUDENT,
                        createdByName: backendThread.author 
                            ? `${backendThread.author.firstName || ''} ${backendThread.author.lastName || ''}`.trim() || 'Unknown User'
                            : 'Unknown User',
                        commentsCount: backendThread._count?.comments || this.selectedThread!.commentsCount || 0,
                        isResolved: backendThread.isResolved,
                        isPinned: backendThread.isPinned,
                        createdAt: new Date(backendThread.createdAt),
                        updatedAt: new Date(backendThread.updatedAt)
                    };
                    
                    this.selectedThread = updatedThread;
                    // Update the thread in the list
                    const index = this.discussionThreads.findIndex(t => t.id === updatedThread.id);
                    if (index !== -1) {
                        this.discussionThreads[index] = updatedThread;
                    }
                },
                error: (error) => {
                    console.error('Error toggling thread pin:', error);
                }
            });
    }

    /**
     * Deletes a thread (either selected thread or specific thread from list)
     * @param thread Optional specific thread to delete. If not provided, uses selectedThread
     */
    deleteThread(thread?: DiscussionThread): void {
        const threadToDelete = thread || this.selectedThread;
        
        if (!threadToDelete) {
            return;
        }

        // Use unified permission check
        const canDelete = this.canDeleteThread(threadToDelete);
        
        if (!canDelete) {
            return;
        }

        this.discussionService.deleteThread(threadToDelete.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    // Remove thread from list
                    const index = this.discussionThreads.findIndex(t => t.id === threadToDelete.id);
                    if (index !== -1) {
                        this.discussionThreads.splice(index, 1);
                    }
                    
                    // If this was the selected thread, go back to list view
                    if (this.selectedThread?.id === threadToDelete.id) {
                        this.backToThreadList();
                    }
                },
                error: (error) => {
                    console.error('Error deleting thread:', error);
                    alert('Fehler beim Löschen der Frage: ' + (error.error?.message || error.message || 'Unbekannter Fehler'));
                }
            });
    }

    /**
     * Checks if the current user can resolve the selected thread
     * Only the thread creator or tutors/admins can resolve threads
     * @param thread Optional thread to check. If not provided, uses selectedThread
     * @returns True if user can resolve the thread
     */
    canResolveThread(thread?: DiscussionThread): boolean {
        const threadToCheck = thread || this.selectedThread;
        if (!threadToCheck) return false;
        
        // Check if this is a locally created thread
        if (this.locallyCreatedThreads.has(threadToCheck.id)) return true;
        
        // If backend doesn't provide createdBy, allow based on role only
        if (!threadToCheck.createdBy || threadToCheck.createdBy === 0) {
            return this.userRole === Role.TUTOR || this.userRole === Role.ADMIN;
        }
        
        // Thread creator can resolve their own thread
        if (threadToCheck.createdBy === this.userId) return true;
        
        // Tutors and admins can resolve any thread
        return this.userRole === Role.TUTOR || this.userRole === Role.ADMIN;
    }

    /**
     * Checks if the current user can pin/unpin threads
     * @returns True if user can pin threads
     */
    canPinThread(): boolean {
        return this.userRole === Role.TUTOR || this.userRole === Role.ADMIN;
    }

    /**
     * Checks if the selected thread is resolved
     * @returns True if thread is resolved
     */
    isThreadResolved(): boolean {
        return this.selectedThread?.isResolved ?? false;
    }

    /**
     * Checks if the selected thread is pinned
     * @returns True if thread is pinned
     */
    isThreadPinned(): boolean {
        return this.selectedThread?.isPinned ?? false;
    }

    /**
     * Returns to the thread list view
     */
    backToThreadList(): void {
        this.selectedThread = null;
        this.chatMessages = [];
    }

    /**
     * Checks if the current user can delete a specific thread
     * Only the thread creator or admins can delete threads
     * @param thread The thread to check permissions for
     * @returns True if user can delete the thread
     */
    canDeleteThread(thread: DiscussionThread): boolean {
        if (!thread) {
            return false;
        }
        
        // Check if this is a locally created thread
        if (this.locallyCreatedThreads.has(thread.id)) {
            return true;
        }
        
        // If backend doesn't provide createdBy, allow admins only
        if (!thread.createdBy || thread.createdBy === 0) {
            return this.userRole === Role.ADMIN;
        }
        
        // Thread creator can delete their own thread
        if (thread.createdBy === this.userId) {
            return true;
        }
        
        // Admins can delete any thread
        return this.userRole === Role.ADMIN;
    }

    /**
     * Marks a specific thread as resolved from the thread list
     * @param thread The thread to mark as resolved
     */
    /**
     * Toggles pin status for a specific thread from the thread list
     * @param thread The thread to toggle pin status for
     */
    toggleThreadPinFromList(thread: DiscussionThread): void {
        if (!thread || !this.canPinThread()) {
            return;
        }

        this.discussionService.toggleThreadPin(thread.id, !thread.isPinned)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (backendThread: BackendThreadResponse) => {
                    // Map backend response to frontend format
                    const updatedThread: DiscussionThread = {
                        id: backendThread.id,
                        title: backendThread.title,
                        description: backendThread.description,
                        createdBy: backendThread.author?.id || backendThread.authorId || 0,
                        createdByRole: backendThread.author?.role || Role.STUDENT,
                        createdByName: backendThread.author 
                            ? `${backendThread.author.firstName || ''} ${backendThread.author.lastName || ''}`.trim() || 'Unknown User'
                            : 'Unknown User',
                        commentsCount: backendThread._count?.comments || thread.commentsCount || 0,
                        isResolved: backendThread.isResolved,
                        isPinned: backendThread.isPinned,
                        createdAt: new Date(backendThread.createdAt),
                        updatedAt: new Date(backendThread.updatedAt)
                    };
                    
                    // Update the thread in the list
                    const index = this.discussionThreads.findIndex(t => t.id === updatedThread.id);
                    if (index !== -1) {
                        this.discussionThreads[index] = updatedThread;
                    }
                    
                    // Update selected thread if it's the same
                    if (this.selectedThread?.id === updatedThread.id) {
                        this.selectedThread = updatedThread;
                    }
                },
                error: (error) => {
                    console.error('Error toggling thread pin from list:', error);
                }
            });
    }

    /**
     * Gets the localized text for answer count
     * @param count The number of answers
     * @returns Localized text for answer count
     */
    getAnswersCountText(count: number): string {
        if (count === 1) {
            return this.translate.instant('DASHBOARD.ANSWER_COUNT_SINGLE');
        } else {
            return this.translate.instant('DASHBOARD.ANSWER_COUNT_PLURAL', { count });
        }
    }
}
