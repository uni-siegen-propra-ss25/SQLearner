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
      case Difficulty.EASY:
        return '#4CAF50';  // Green
      case Difficulty.MEDIUM:
        return '#FF9800';  // Orange
      case Difficulty.HARD:
        return '#F44336';  // Red
      default:
        return '#9E9E9E';  // Gray
    }
  }

  getExerciseTypeIcon(type: ExerciseType): string {
    switch (type) {
      case ExerciseType.QUERY:
        return 'code';
      case ExerciseType.CHOICE:
        return 'check_box';
      case ExerciseType.FREETEXT:
        return 'subject';
      default:
        return 'help';
    }
  }

  getExerciseTypeLabel(type: ExerciseType): string {
    switch (type) {
      case ExerciseType.QUERY:
        return 'SQL Query';
      case ExerciseType.CHOICE:
        return 'Multiple Choice';
      case ExerciseType.FREETEXT:
        return 'Free Text';
      default:
        return type;
    }
  }
} 