import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Exercise } from '../../roadmap/models/exercise.model';

@Injectable({
    providedIn: 'root',
})
export class ExercisesService {
    private readonly baseUrl = `${environment.apiUrl}/exercises`;

    constructor(private readonly http: HttpClient) {}

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
            // Client-side error
            errorMessage = error.error.message;
        } else {
            // Server-side error
            errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }

    getExercises(): Observable<Exercise[]> {
        return this.http
            .get<Exercise[]>(this.baseUrl)
            .pipe(catchError((error) => this.handleError(error)));
    }

    getExercisesByTopic(topicId: number): Observable<Exercise[]> {
        return this.http
            .get<Exercise[]>(`${this.baseUrl}/topics/${topicId}`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    getExercise(id: number): Observable<Exercise> {
        return this.http
            .get<Exercise>(`${this.baseUrl}/${id}`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    createExercise(exercise: Partial<Exercise>): Observable<number> {
        return this.http
            .post<number>(this.baseUrl, exercise)
            .pipe(catchError((error) => this.handleError(error)));
    }

    updateExercise(id: number, exercise: Partial<Exercise>): Observable<Exercise> {
        return this.http
            .put<Exercise>(`${this.baseUrl}/${id}`, exercise)
            .pipe(catchError((error) => this.handleError(error)));
    }

    deleteExercise(id: number): Observable<void> {
        return this.http
            .delete<void>(`${this.baseUrl}/${id}`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    reorderExercises(exercises: { id: number; order: number }[]): Observable<void> {
        return this.http
            .put<void>(`${this.baseUrl}/reorder`, { exercises })
            .pipe(catchError((error) => this.handleError(error)));
    }

    runQuery(exerciseId: number, query: string): Observable<any> {
        return this.http
            .post<any>(`${this.baseUrl}/${exerciseId}/run-query`, { query })
            .pipe(catchError((error) => this.handleError(error)));
    }
}
