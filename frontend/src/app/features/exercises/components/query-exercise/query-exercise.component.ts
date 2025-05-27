import { Component, Input } from '@angular/core';
import { Exercise } from '../../../roadmap/models/exercise.model';

@Component({
  selector: 'app-query-exercise',
  templateUrl: './query-exercise.component.html',
  styleUrls: ['./query-exercise.component.scss']
})
export class QueryExerciseComponent {
  @Input() exercise!: Exercise;
}
