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

    submitAnswer(exerciseId: number, answer: string): Observable<Feedback> {
        return this.http.post<Feedback>(`${this.baseUrl}/exercises/${exerciseId}/submit`, {
            answerText: answer,
        });
    }

    runQuery(exerciseId: number, query: string): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/exercises/${exerciseId}/run-query`, { query });
    }
}
