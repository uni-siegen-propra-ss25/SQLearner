import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Exercise, ExerciseType, Difficulty } from '../../../roadmap/models/exercise.model';
import { Location } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
    selector: 'app-dynamic-exercise',
    templateUrl: './dynamic-exercise.component.html',
    styleUrls: ['./dynamic-exercise.component.scss'],
    animations: [
        trigger('slideInOut', [
            transition(':enter', [
                style({ transform: 'translateX(100%)' }),
                animate('200ms ease-out', style({ transform: 'translateX(0%)' }))
            ]),
            transition(':leave', [
                animate('200ms ease-in', style({ transform: 'translateX(100%)' }))
            ])
        ])
    ]
})
export class DynamicExerciseComponent implements OnInit {
    exercise: Exercise | null = null;
    ExerciseType = ExerciseType;
    isChatOpen = false;

    constructor(
        private route: ActivatedRoute,
        private location: Location,
    ) {}

    ngOnInit() {
        this.route.data.subscribe((data) => {
            this.exercise = data['exercise'];
        });
    }

    goBack(): void {
        this.location.back();
    }

    toggleChat(): void {
        this.isChatOpen = !this.isChatOpen;
    }

    getTypeIcon(): string {
        if (!this.exercise) return 'help';
        switch (this.exercise.type) {
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

    getTypeLabel(): string {
        if (!this.exercise) return '';
        switch (this.exercise.type) {
            case ExerciseType.QUERY:
                return 'SQL Query';
            case ExerciseType.SINGLE_CHOICE:
                return 'Single Choice';
            case ExerciseType.MULTIPLE_CHOICE:
                return 'Multiple Choice';
            case ExerciseType.FREETEXT:
                return 'Free Text';
            default:
                return this.exercise.type;
        }
    }

    getDifficultyColor(): string {
        if (!this.exercise) return '#9E9E9E';
        switch (this.exercise.difficulty) {
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
}
