import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Exercise, ExerciseType, Difficulty } from '../../models/exercise.model';

@Component({
  selector: 'app-exercise-card',
  templateUrl: './exercise-card.component.html',
  styleUrls: ['./exercise-card.component.scss']
})
export class ExerciseCardComponent {
  @Input() exercise!: Exercise;
  @Input() isTutor = false;
  @Output() edit = new EventEmitter<Exercise>();
  @Output() delete = new EventEmitter<number>();

  ExerciseType = ExerciseType;
  Difficulty = Difficulty;

  getDifficultyColor(difficulty: Difficulty): string {
    switch (difficulty) {
      case Difficulty.BEGINNER:
        return 'green';
      case Difficulty.INTERMEDIATE:
        return 'orange';
      case Difficulty.ADVANCED:
        return 'red';
      case Difficulty.EXPERT:
        return 'purple';
      default:
        return 'gray';
    }
  }

  getExerciseTypeIcon(type: ExerciseType): string {
    switch (type) {
      case ExerciseType.SQL:
        return 'code';
      case ExerciseType.MULTIPLE_CHOICE:
        return 'check_box';
      case ExerciseType.TEXT:
        return 'subject';
      default:
        return 'help';
    }
  }
} 