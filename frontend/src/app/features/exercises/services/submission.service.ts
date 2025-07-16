import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Feedback } from '../../roadmap/models/exercise.model';

@Injectable({
    providedIn: 'root',
})
export class SubmissionService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    submitAnswer(
        exerciseId: number,
        answer: string,
        connectionDetails?: { host: string; port: number },
    ): Observable<Feedback> {
        return this.http.post<Feedback>(`${this.baseUrl}/exercises/${exerciseId}/submit`, {
            answerText: answer,
            connectionDetails,
        });
    }

    runQuery(
        exerciseId: number,
        query: string,
        connectionDetails?: { host: string; port: number; database?: string },
    ): Observable<any> {
        console.log('=== DEBUG: SubmissionService.runQuery ===');
        console.log('Exercise ID:', exerciseId);
        console.log('Query:', query);
        console.log('Connection Details:', connectionDetails);

        const payload = { query, connectionDetails };
        console.log('Request payload:', payload);

        return this.http.post<any>(`${this.baseUrl}/exercises/${exerciseId}/run-query`, payload);
    }
}
