import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-freetext-exercise',
  templateUrl: './freetext-exercise.component.html',
  styleUrls: ['./freetext-exercise.component.scss']
})
export class FreetextExerciseComponent {
  @Input() exercise: any;
}
