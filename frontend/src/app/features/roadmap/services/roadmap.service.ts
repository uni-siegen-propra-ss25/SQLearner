import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Chapter } from '../models/chapter.model';
import { Topic } from '../models/topic.model';
import { Exercise } from '../models/exercise.model';

@Injectable({
    providedIn: 'root',
})
export class RoadmapService {
    private readonly baseUrl = environment.apiUrl;

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

    // Chapter endpoints
    getChapters(): Observable<Chapter[]> {
        return this.http
            .get<Chapter[]>(`${this.baseUrl}/chapters`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    getChapter(id: number): Observable<Chapter> {
        return this.http
            .get<Chapter>(`${this.baseUrl}/chapters/${id}`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    createChapter(chapter: Partial<Chapter>): Observable<number> {
        return this.http
            .post<number>(`${this.baseUrl}/chapters`, chapter)
            .pipe(catchError((error) => this.handleError(error)));
    }

    updateChapter(id: number, chapter: Partial<Chapter>): Observable<void> {
        return this.http
            .put<void>(`${this.baseUrl}/chapters/${id}`, chapter)
            .pipe(catchError((error) => this.handleError(error)));
    }

    deleteChapter(id: number): Observable<void> {
        return this.http
            .delete<void>(`${this.baseUrl}/chapters/${id}`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    // Topic endpoints - nested under chapters as per backend structure
    getTopics(chapterId: number): Observable<Topic[]> {
        return this.http
            .get<Topic[]>(`${this.baseUrl}/chapters/${chapterId}/topics`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    getTopic(chapterId: number, id: number): Observable<Topic> {
        return this.http
            .get<Topic>(`${this.baseUrl}/chapters/${chapterId}/topics/${id}`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    createTopic(chapterId: number, topic: Partial<Topic>): Observable<number> {
        return this.http
            .post<number>(`${this.baseUrl}/chapters/${chapterId}/topics`, topic)
            .pipe(catchError((error) => this.handleError(error)));
    }

    updateTopic(chapterId: number, id: number, topic: Partial<Topic>): Observable<Topic> {
        return this.http
            .put<Topic>(`${this.baseUrl}/chapters/${chapterId}/topics/${id}`, topic)
            .pipe(catchError((error) => this.handleError(error)));
    }

    deleteTopic(chapterId: number, id: number): Observable<void> {
        return this.http
            .delete<void>(`${this.baseUrl}/chapters/${chapterId}/topics/${id}`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    reorderTopics(chapterId: number, topics: { id: number; order: number }[]): Observable<void> {
        return this.http
            .put<void>(`${this.baseUrl}/chapters/${chapterId}/topics/reorder`, { topics })
            .pipe(catchError((error) => this.handleError(error)));
    }

    // Note: Exercise-related operations have been moved to ExercisesService
}
