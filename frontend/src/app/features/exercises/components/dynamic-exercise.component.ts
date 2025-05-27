import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Exercise, ExerciseType } from '../../roadmap/models/exercise.model';

@Component({
  selector: 'app-dynamic-exercise',
  template: `
    <ng-container *ngIf="exercise" class="exercise-container">
      <app-query-exercise 
        *ngIf="exercise.type === ExerciseType.QUERY" 
        [exercise]="exercise">
      </app-query-exercise>
      
      <app-choice-exercise 
        *ngIf="exercise.type === ExerciseType.CHOICE" 
        [exercise]="exercise">
      </app-choice-exercise>
      
      <app-freetext-exercise 
        *ngIf="exercise.type === ExerciseType.FREETEXT" 
        [exercise]="exercise">
      </app-freetext-exercise>
    </ng-container>
  `,
  styles: [`
    :host {
      display: block;
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }
  `]
})
export class DynamicExerciseComponent implements OnInit {
  exercise: Exercise | null = null;
  ExerciseType = ExerciseType;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.exercise = data['exercise'];
    });
  }
}