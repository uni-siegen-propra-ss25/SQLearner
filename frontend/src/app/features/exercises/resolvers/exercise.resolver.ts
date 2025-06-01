import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Exercise } from '../../roadmap/models/exercise.model';
import { ExercisesService } from '../services/exercises.service';

@Injectable({
    providedIn: 'root',
})
export class ExerciseResolver implements Resolve<Exercise> {
    constructor(private exercisesService: ExercisesService) {}

    resolve(route: ActivatedRouteSnapshot): Observable<Exercise> {
        const exerciseId = parseInt(route.paramMap.get('exerciseId') || '0', 10);
        return this.exercisesService.getExercise(exerciseId);
    }
}