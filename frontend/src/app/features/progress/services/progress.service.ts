import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { UserProgressSummary, ChapterProgress } from '../models/progress.model';
import { ProgressDto } from '../models/progress-dto.model';

/**
 * Unified service for managing user progress data across all components.
 * Provides centralized state management using BehaviorSubject for real-time updates.
 * Eliminates need for localStorage fallbacks by maintaining server-side synchronization.
 */
@Injectable({
    providedIn: 'root',
})
export class ProgressService {
    private readonly baseUrl = `${environment.apiUrl}/progress`;

    /**
     * Central state holder for progress data.
     * Emits updates to all subscribed components when progress changes.
     */
    private progressSubject = new BehaviorSubject<ProgressDto>({
        completedExerciseIds: [],
        totalCount: 0,
        chapterProgress: [],
    });

    /**
     * Public observable for components to subscribe to progress updates.
     * Automatically provides latest progress state to all subscribers.
     */
    public readonly progress$ = this.progressSubject.asObservable();

    constructor(private readonly http: HttpClient) {
        // Initialize progress data on service creation
        this.loadInitialProgress();
    }

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
     * Loads initial progress data when service is created.
     * Called automatically in constructor to populate the BehaviorSubject.
     * @private
     * @returns {void}
     */
    private loadInitialProgress(): void {
        console.log('🚀 LOADING INITIAL PROGRESS...');
        this.getUserProgressInternal().subscribe({
            next: (progress) => {
                console.log('✅ INITIAL PROGRESS LOADED:', progress);
                this.progressSubject.next(progress);
            },
            error: (error) => {
                console.error('🚨 FAILED TO LOAD INITIAL PROGRESS:', error);
                // Keep empty default state on error
            },
        });
    }

    /**
     * Internal method to fetch and transform progress data from backend.
     * Converts UserProgressSummary to simplified ProgressDto format.
     * Uses fallback strategy if detailed exercise data is not available.
     * @private
     * @returns {Observable<ProgressDto>} Observable containing the transformed progress data
     */
    private getUserProgressInternal(): Observable<ProgressDto> {
        console.log('🔄 STARTING getUserProgressInternal - API URL:', `${this.baseUrl}/user`);

        return this.http.get<UserProgressSummary>(`${this.baseUrl}/user`).pipe(
            tap((response) => {
                console.log('🔄 RAW API RESPONSE received:', response);
                console.log('🔄 RAW API RESPONSE type:', typeof response);
                console.log('🔄 RAW API RESPONSE keys:', Object.keys(response || {}));
            }),
            switchMap((summary: UserProgressSummary) => {
                console.log('🔄 PROCESSING summary in switchMap:', summary);

                // Check if detailed exercise data is available
                const hasDetailedData = summary.chapterProgress?.some(
                    (chapter: ChapterProgress) => chapter.exercises && chapter.exercises.length > 0,
                );

                console.log('🔄 DETAILED DATA CHECK:', hasDetailedData);
                console.log('🔄 CHAPTER PROGRESS:', summary.chapterProgress);

                if (hasDetailedData) {
                    console.log('✅ Using detailed data transformation');
                    // Use detailed data if available
                    return of(this.transformToProgressDto(summary));
                } else {
                    // Fallback: fetch completed exercise IDs separately
                    console.warn(
                        '⚠️ No detailed exercise data in UserProgressSummary, using fallback',
                    );
                    return this.getCompletedExerciseIds().pipe(
                        map((completedIds: number[]) =>
                            this.createProgressDtoWithFallback(summary, completedIds),
                        ),
                    );
                }
            }),
            tap((finalDto) => {
                console.log('🔄 FINAL DTO before emission:', finalDto);
            }),
            catchError((error) => {
                console.error('🚨 ERROR in getUserProgressInternal:', error);
                return this.handleError(error);
            }),
        );
    }

    /**
     * Creates ProgressDto using fallback strategy when detailed exercise data is not available.
     * Uses separate API call to get completed exercise IDs.
     * @private
     * @param {UserProgressSummary} summary - The user's progress summary
     * @param {number[]} completedIds - Array of completed exercise IDs
     * @returns {ProgressDto} The constructed progress DTO
     */
    private createProgressDtoWithFallback(
        summary: UserProgressSummary,
        completedIds: number[],
    ): ProgressDto {
        const chapterProgress =
            summary.chapterProgress?.map((chapter) => ({
                chapterId: chapter.chapterId,
                chapterTitle: chapter.chapterTitle,
                completedExerciseIds: [], // Will be empty since we don't have per-chapter breakdown
                totalExercises: chapter.totalExercises,
            })) || [];

        return {
            completedExerciseIds: completedIds,
            totalCount: summary.totalExercises,
            chapterProgress,
        };
    }

    /**
     * Transforms complex UserProgressSummary to simplified ProgressDto.
     * Extracts completed exercise IDs from nested chapter structure.
     * @private
     * @param {UserProgressSummary} summary - The user's progress summary
     * @returns {ProgressDto} The constructed progress DTO
     */
    private transformToProgressDto(summary: UserProgressSummary): ProgressDto {
        console.log('🔄 TRANSFORM - Input summary:', summary);

        const completedExerciseIds: number[] = [];
        const chapterProgress =
            summary.chapterProgress?.map((chapter) => {
                console.log(
                    '🔄 TRANSFORM - Processing chapter:',
                    chapter.chapterTitle,
                    'with',
                    chapter.exercises?.length || 0,
                    'exercises',
                );

                const chapterCompletedIds =
                    chapter.exercises?.filter((ex) => ex.isPassed)?.map((ex) => ex.exerciseId) ||
                    [];

                console.log('🔄 TRANSFORM - Chapter completed IDs:', chapterCompletedIds);
                completedExerciseIds.push(...chapterCompletedIds);

                return {
                    chapterId: chapter.chapterId,
                    chapterTitle: chapter.chapterTitle,
                    completedExerciseIds: chapterCompletedIds,
                    totalExercises: chapter.totalExercises,
                };
            }) || [];

        const result: ProgressDto = {
            completedExerciseIds,
            totalCount: summary.totalExercises,
            chapterProgress,
        };

        console.log('🔄 TRANSFORM - Final ProgressDto:', result);
        return result;
    }

    /**
     * Triggers a reload of progress data from the backend.
     * Updates the BehaviorSubject with fresh data from server.
     * Should be called after exercise completions to sync state.
     */
    reloadUserProgress(): void {
        this.getUserProgressInternal().subscribe({
            next: (progress) => this.progressSubject.next(progress),
            error: (error) => console.error('Failed to reload progress:', error),
        });
    }

    /**
     * Records completion of an exercise and automatically reloads progress.
     * Combines the completion API call with immediate state refresh.
     * @param {number} exerciseId - The ID of the completed exercise
     * @returns {Observable<void>} Observable that completes when both operations finish
     */
    recordCompletion(exerciseId: number): Observable<void> {
        return this.http
            .post<void>(`${this.baseUrl}/exercise/${exerciseId}`, { isPassed: true })
            .pipe(
                tap(() => this.reloadUserProgress()),
                catchError((error) => this.handleError(error)),
            );
    }

    /**
     * Retrieves the authenticated user's progress in simplified DTO format.
     * Returns the centrally managed progress observable for real-time updates.
     * @returns {Observable<ProgressDto>} Observable containing simplified progress data
     */
    getUserProgress(): Observable<ProgressDto> {
        return this.progress$;
    }

    /**
     * Retrieves the authenticated user's comprehensive progress summary.
     * Provides detailed progress data for administrative purposes.
     * @returns {Observable<UserProgressSummary>} Observable containing detailed progress data
     */
    getUserProgressDetailed(): Observable<UserProgressSummary> {
        return this.http
            .get<UserProgressSummary>(`${this.baseUrl}/user`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    /**
     * Retrieves completed exercise IDs directly from the backend.
     * Workaround for missing exercise details in UserProgressSummary.
     * @returns {Observable<number[]>} Observable containing array of completed exercise IDs
     */
    getCompletedExerciseIds(): Observable<number[]> {
        return this.http.get<number[]>(`${this.baseUrl}/user/completed-exercises`).pipe(
            catchError((error) => {
                console.error('Failed to load completed exercise IDs:', error);
                return of([]);
            }),
        );
    }

    /**
     * Retrieves progress summary for a specific user by ID.
     * Only accessible by tutors and admins.
     *
     * @param {number} userId - The ID of the user to get progress for
     * @returns {Observable<UserProgressSummary>} Observable containing progress data
     */
    getUserProgressById(userId: number): Observable<UserProgressSummary> {
        return this.http
            .get<UserProgressSummary>(`${this.baseUrl}/user/${userId}`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    /**
     * Retrieves progress summaries for all users.
     * Only accessible by tutors and admins.
     *
     * @returns {Observable<UserProgressSummary[]>} Observable containing array of progress summaries
     */
    getAllUsersProgress(): Observable<UserProgressSummary[]> {
        return this.http
            .get<UserProgressSummary[]>(`${this.baseUrl}/users`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    /**
     * Updates the progress status for a specific exercise when a user completes an attempt.
     * @deprecated Use recordCompletion() instead for automatic progress refresh
     * @param {number} exerciseId - The unique identifier of the exercise being updated
     * @param {boolean} isPassed - Whether the user successfully completed the exercise
     * @returns {Observable<void>} Observable that completes when update is successful
     */
    updateExerciseProgress(exerciseId: number, isPassed: boolean): Observable<void> {
        return this.http
            .post<void>(`${this.baseUrl}/exercise/${exerciseId}`, { isPassed })
            .pipe(catchError((error) => this.handleError(error)));
    }

    /**
     * Checks if a specific exercise has been completed correctly by the user.
     * @param {number} exerciseId - The ID of the exercise to check
     * @returns {boolean} True if the exercise has been completed correctly, false otherwise
     */
    isCorrectAnswer(exerciseId: number): boolean {
        const currentProgress = this.progressSubject.value;
        return currentProgress.completedExerciseIds.includes(exerciseId);
    }
}
