import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exercise } from '../../roadmap/models/exercise.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExerciseService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getExercise(topicId: number, exerciseId: number): Observable<Exercise> {
        return this.http.get<Exercise>(`${this.baseUrl}/topics/${topicId}/exercises/${exerciseId}`);
    }
}
