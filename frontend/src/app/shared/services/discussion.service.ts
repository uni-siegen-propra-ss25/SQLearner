import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Role } from '../../features/users/models/role.model';
import { environment } from '../../../environments/environment';

/**
 * Interface representing the backend response structure for threads
 */
export interface BackendThreadResponse {
    id: number;
    title: string;
    description: string;
    authorId: number;
    isResolved: boolean;
    isPinned: boolean;
    createdAt: string;
    updatedAt: string;
    author?: {
        id: number;
        firstName: string;
        lastName: string;
        role: Role;
    };
    _count?: {
        comments: number;
    };
}

/**
 * Interface representing a discussion thread/topic for the frontend
 */
export interface DiscussionThread {
    id: number;
    title: string;
    description: string;
    createdBy: number;
    createdByName: string;
    createdByRole: Role;
    isResolved: boolean;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
    commentsCount: number;
}

/**
 * Interface representing a comment in a discussion thread
 */
export interface DiscussionComment {
    id: number;
    threadId: number;
    content: string;
    authorId: number;
    authorName: string;
    authorRole: Role;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * DTO for creating a new discussion thread
 */
export interface CreateThreadDto {
    title: string;
    description: string;
}

/**
 * DTO for creating a new comment
 */
export interface CreateCommentDto {
    content: string;
}

/**
 * Service for managing discussion threads and comments.
 * Provides functionality for creating topics, adding comments,
 * and managing thread status (resolved, pinned).
 */
@Injectable({
    providedIn: 'root',
})
export class DiscussionService {
    private apiUrl = `${environment.apiUrl}/discussions`;
    
    /** BehaviorSubject to track real-time updates of active discussions */
    private activeThreadsSubject = new BehaviorSubject<DiscussionThread[]>([]);
    public activeThreads$ = this.activeThreadsSubject.asObservable();

    constructor(private http: HttpClient) {}

    /**
     * Retrieves all discussion threads
     * @returns Observable containing array of backend thread responses
     */
    getThreads(): Observable<BackendThreadResponse[]> {
        return this.http.get<BackendThreadResponse[]>(this.apiUrl);
    }

    /**
     * Retrieves a specific discussion thread by ID
     * @param threadId The ID of the thread to retrieve
     * @returns Observable containing the discussion thread
     */
    getThread(threadId: number): Observable<DiscussionThread> {
        return this.http.get<DiscussionThread>(`${this.apiUrl}/${threadId}`);
    }

    /**
     * Creates a new discussion thread
     * @param thread The thread data to create
     * @returns Observable containing the created thread
     */
    createThread(thread: CreateThreadDto): Observable<BackendThreadResponse> {
        return this.http.post<BackendThreadResponse>(this.apiUrl, thread);
    }

    /**
     * Marks a discussion thread as resolved (only for thread creator)
     * @param threadId The ID of the thread to mark as resolved
     * @param isResolved Whether the thread should be marked as resolved
     * @returns Observable containing the updated thread
     */
    markThreadAsResolved(threadId: number, isResolved: boolean): Observable<BackendThreadResponse> {
        return this.http.patch<BackendThreadResponse>(`${this.apiUrl}/${threadId}/resolve`, { isResolved });
    }

    /**
     * Pins or unpins a discussion thread (tutors/admins only)
     * @param threadId The ID of the thread to pin/unpin
     * @param isPinned Whether the thread should be pinned
     * @returns Observable containing the updated thread
     */
    toggleThreadPin(threadId: number, isPinned: boolean): Observable<BackendThreadResponse> {
        return this.http.patch<BackendThreadResponse>(`${this.apiUrl}/${threadId}/pin`, { isPinned });
    }

    /**
     * Retrieves all comments for a specific thread
     * @param threadId The ID of the thread to get comments for
     * @returns Observable containing array of comments
     */
    getComments(threadId: number): Observable<DiscussionComment[]> {
        return this.http.get<DiscussionComment[]>(`${this.apiUrl}/${threadId}/comments`);
    }

    /**
     * Adds a new comment to a discussion thread
     * @param threadId The ID of the thread to add comment to
     * @param comment The comment data to add
     * @returns Observable containing the created comment
     */
    addComment(threadId: number, comment: CreateCommentDto): Observable<DiscussionComment> {
        return this.http.post<DiscussionComment>(`${this.apiUrl}/${threadId}/comments`, comment);
    }

    /**
     * Deletes a comment (only comment author or admin)
     * @param threadId The ID of the thread containing the comment
     * @param commentId The ID of the comment to delete
     * @returns Observable for the delete operation
     */
    deleteComment(threadId: number, commentId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${threadId}/comments/${commentId}`);
    }

    /**
     * Deletes a discussion thread (only thread creator or admin)
     * @param threadId The ID of the thread to delete
     * @returns Observable for the delete operation
     */
    deleteThread(threadId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${threadId}`);
    }

    /**
     * Updates the local active threads cache
     * @param threads Array of current active threads
     */
    updateActiveThreads(threads: DiscussionThread[]): void {
        this.activeThreadsSubject.next(threads);
    }
}