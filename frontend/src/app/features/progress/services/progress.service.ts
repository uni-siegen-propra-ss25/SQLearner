import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ProgressData, ChapterProgress, UserProgressSummary } from '../models/progress.model';

@Injectable({
    providedIn: 'root'
})
export class ProgressService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

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
    }    getUserProgress(): Observable<UserProgressSummary> {
        return this.http
            .get<UserProgressSummary>(`${this.baseUrl}/api/progress/user`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    updateExerciseProgress(exerciseId: number, isPassed: boolean): Observable<void> {
        return this.http
            .post<void>(`${this.baseUrl}/api/progress/exercise/${exerciseId}`, { 
                exerciseId, 
                isPassed 
            })
            .pipe(catchError((error) => this.handleError(error)));
    }
}
