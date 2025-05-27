import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-choice-exercise',
  templateUrl: './choice-exercise.component.html',
  styleUrls: ['./choice-exercise.component.scss']
})
export class ChoiceExerciseComponent {
  @Input() exercise: any;
}
