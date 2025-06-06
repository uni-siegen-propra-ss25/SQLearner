import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { UserProgressSummary } from '../models/progress.model';

/**
 * Service responsible for managing user progress data and communication with the backend API.
 * Handles HTTP requests for retrieving progress statistics and updating exercise completion status.
 * Provides error handling and type-safe observables for all progress-related operations.
 */
@Injectable({
    providedIn: 'root'
})
export class ProgressService {
    private readonly baseUrl = `${environment.apiUrl}/progress`;

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
            // Client-side error
            errorMessage = error.error.message;
        } else {
            // Server-side error
            errorMessage = `Fehlercode: ${error.status}\nNachricht: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }

    /**
     * Retrieves the authenticated user's comprehensive progress summary.
     * Fetches overall completion statistics, chapter-specific progress, and difficulty breakdowns.
     * 
     * @returns {Observable<UserProgressSummary>} Observable containing complete progress data including total exercises, completion percentage, chapter progress, and difficulty statistics
     * @throws {Error} When API request fails or user is not authenticated
     */
    getUserProgress(): Observable<UserProgressSummary> {
        return this.http
            .get<UserProgressSummary>(`${this.baseUrl}/user`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    /**
     * Retrieves progress summary for a specific user by ID.
     * Only accessible by tutors and admins.
     * 
     * @param {number} userId - The ID of the user to get progress for
     * @returns {Observable<UserProgressSummary>} Observable containing complete progress data for the specified user
     * @throws {Error} When API request fails or user is not authorized
     */
    getUserProgressById(userId: number): Observable<UserProgressSummary> {
        return this.http
            .get<UserProgressSummary>(`${this.baseUrl}/user/${userId}`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    /**
     * Updates the progress status for a specific exercise when a user completes an attempt.
     * Sends completion status to the backend to track learning progress and statistics.
     * 
     * @param {number} exerciseId - The unique identifier of the exercise being updated
     * @param {boolean} isPassed - Whether the user successfully completed the exercise
     * @returns {Observable<void>} Observable that completes when the progress update is successful
     * @throws {Error} When API request fails, exercise doesn't exist, or user is not authenticated
     */
    updateExerciseProgress(exerciseId: number, isPassed: boolean): Observable<void> {
        return this.http
            .post<void>(`${this.baseUrl}/exercise/${exerciseId}`, { isPassed })
            .pipe(catchError((error) => this.handleError(error)));
    }
}
