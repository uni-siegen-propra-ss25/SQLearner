import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Exercise } from '../../roadmap/models/exercise.model';
import { ExerciseService } from '../services/exercise.service';

@Injectable({ providedIn: 'root' })
export class ExerciseResolver implements Resolve<Exercise> {
  constructor(private exerciseService: ExerciseService) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Exercise> {
    const topicId = Number(route.paramMap.get('topicId'));
    const exerciseId = Number(route.paramMap.get('exerciseId'));
    return this.exerciseService.getExercise(topicId, exerciseId);
  }
}
