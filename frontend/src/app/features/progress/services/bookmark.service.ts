import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BookmarkData } from '../models/bookmark.model';

/**
 * Service responsible for managing user bookmarks for exercises.
 * Handles HTTP requests for creating, retrieving, and deleting bookmarks to save exercises for later review.
 * Provides error handling and type-safe observables for all bookmark-related operations.
 */
@Injectable({
    providedIn: 'root'
})
export class BookmarkService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    /**
     * Handles HTTP errors and provides user-friendly error messages.
     * Differentiates between client-side and server-side errors for better debugging.
     * 
     * @private
     * @param {HttpErrorResponse} error - The HTTP error response from the server
     * @returns {Observable<never>} Observable that throws a formatted error message
     */
    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Ein Fehler ist aufgetreten';
        if (error.error instanceof ErrorEvent) {
            // Client-side Fehler
            errorMessage = error.error.message;
        } else {
            // Server-side Fehler
            errorMessage = `Fehlercode: ${error.status}\nNachricht: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }

    /**
     * Retrieves all bookmarks for the authenticated user.
     * Fetches the complete list of exercises that the user has saved for later review.
     * 
     * @returns {Observable<BookmarkData[]>} Observable containing array of bookmark data with exercise information
     * @throws {Error} When API request fails or user is not authenticated
     */
    getUserBookmarks(): Observable<BookmarkData[]> {
        return this.http
            .get<BookmarkData[]>(`${this.baseUrl}/api/bookmarks/user`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    /**
     * Creates a new bookmark for the specified exercise.
     * Allows users to save exercises they want to revisit later for practice or review.
     * 
     * @param {number} exerciseId - The unique identifier of the exercise to bookmark
     * @returns {Observable<BookmarkData>} Observable containing the created bookmark data
     * @throws {Error} When API request fails, exercise doesn't exist, user is not authenticated, or bookmark already exists
     */
    addBookmark(exerciseId: number): Observable<BookmarkData> {
        return this.http
            .post<BookmarkData>(`${this.baseUrl}/api/bookmarks`, { exerciseId })
            .pipe(catchError((error) => this.handleError(error)));
    }

    /**
     * Removes an existing bookmark by its ID.
     * Allows users to delete bookmarks they no longer need or want to keep.
     * 
     * @param {number} id - The unique identifier of the bookmark to remove
     * @returns {Observable<void>} Observable that completes when the bookmark is successfully deleted
     * @throws {Error} When API request fails, bookmark doesn't exist, or user is not authorized to delete the bookmark
     */
    removeBookmark(id: number): Observable<void> {
        return this.http
            .delete<void>(`${this.baseUrl}/api/bookmarks/${id}`)
            .pipe(catchError((error) => this.handleError(error)));
    }
}
