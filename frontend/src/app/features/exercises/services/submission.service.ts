import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Submission } from '../../roadmap/models/exercise.model';

@Injectable({
    providedIn: 'root',
})
export class SubmissionService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    submitAnswer(exerciseId: number, answer: string): Observable<Submission> {
        return this.http.post<Submission>(`${this.baseUrl}/exercises/${exerciseId}/submissions`, {
            answerText: answer,
        });
    }

    runQuery(exerciseId: number, query: string): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/exercises/${exerciseId}/run-query`, { query });
    }

    getFeedback(submissionId: number): Observable<string> {
        return this.http.get<string>(`${this.baseUrl}/submissions/${submissionId}/feedback`);
    }

    /**
     * Requests AI-powered feedback for a SQL query.
     *
     * @param exerciseId - The ID of the exercise
     * @param query - The SQL query to get feedback for
     * @returns Observable resolving to the AI feedback
     */
    getSqlQueryFeedback(exerciseId: number, query: string): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/exercises/${exerciseId}/sql-feedback`, { query });
    }
}
