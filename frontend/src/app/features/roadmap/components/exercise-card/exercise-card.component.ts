import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Exercise, ExerciseType, Difficulty } from '../../models/exercise.model';
import { Router } from '@angular/router';

@Component({
    selector: 'app-exercise-card',
    templateUrl: './exercise-card.component.html',
    styleUrls: ['./exercise-card.component.scss'],
})
export class ExerciseCardComponent {
    @Input() exercise!: Exercise;
    @Input() isTutor = false;
    @Input() isDragging = false;
    @Output() edit = new EventEmitter<Exercise>();
    @Output() delete = new EventEmitter<number>();

    ExerciseType = ExerciseType;
    Difficulty = Difficulty;

    constructor(private router: Router) {}

    getDifficultyColor(difficulty: Difficulty): string {
        switch (difficulty) {
            case Difficulty.EASY:
                return '#4CAF50'; // Green
            case Difficulty.MEDIUM:
                return '#FF9800'; // Orange
            case Difficulty.HARD:
                return '#F44336'; // Red
            default:
                return '#9E9E9E'; // Gray
        }
    }

    getExerciseTypeIcon(type: ExerciseType): string {
        switch (type) {
            case ExerciseType.QUERY:
                return 'code';
            case ExerciseType.SINGLE_CHOICE:
                return 'radio_button_checked';
            case ExerciseType.MULTIPLE_CHOICE:
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
            case ExerciseType.SINGLE_CHOICE:
                return 'Single Choice';
            case ExerciseType.MULTIPLE_CHOICE:
                return 'Multiple Choice';
            case ExerciseType.FREETEXT:
                return 'Free Text';
            default:
                return type;
        }
    }

    onCardClick() {
        if (!this.isTutor && this.exercise) {
            // Navigiere explizit zur DynamicExerciseComponent-Route
            this.router.navigate([
                '/roadmap',
                'topics',
                this.exercise.topicId,
                'exercises',
                this.exercise.id,
            ]);
        }
    }
}
