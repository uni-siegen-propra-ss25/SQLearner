import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Exercise, ExerciseType, Difficulty } from '../../roadmap/models/exercise.model';
import { Location } from '@angular/common';

@Component({
    selector: 'app-dynamic-exercise',
    template: `
        <ng-container *ngIf="exercise" class="exercise-container">
            <div class="exercise-header">
                <button mat-icon-button (click)="goBack()" aria-label="Go back">
                    <mat-icon>arrow_back</mat-icon>
                </button>
                <div class="metadata">
                    <div class="type-badge">
                        <mat-icon>{{ getTypeIcon() }}</mat-icon>
                        {{ getTypeLabel() }}
                    </div>
                    <div class="difficulty-badge" [style.background-color]="getDifficultyColor()">
                        {{ exercise.difficulty }}
                    </div>
                </div>
            </div>

            <mat-card class="exercise-content">
                <app-query-exercise
                    *ngIf="exercise.type === ExerciseType.QUERY"
                    [exercise]="exercise"
                >
                </app-query-exercise>

                <app-choice-exercise
                    *ngIf="
                        exercise.type === ExerciseType.SINGLE_CHOICE ||
                        exercise.type === ExerciseType.MULTIPLE_CHOICE
                    "
                    [exercise]="exercise"
                >
                </app-choice-exercise>

                <app-freetext-exercise
                    *ngIf="exercise.type === ExerciseType.FREETEXT"
                    [exercise]="exercise"
                >
                </app-freetext-exercise>
            </mat-card>
        </ng-container>
    `,
    styles: [
        `
            :host {
                display: block;
                padding: 24px;
                max-width: 800px;
                margin: 0 auto;
            }

            .exercise-header {
                display: flex;
                align-items: center;
                margin-bottom: 20px;
                gap: 16px;
            }

            .metadata {
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .type-badge,
            .difficulty-badge {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 500;
            }

            .type-badge {
                background-color: rgba(0, 0, 0, 0.05);
                color: rgba(0, 0, 0, 0.7);
            }

            .type-badge mat-icon {
                font-size: 16px;
                width: 16px;
                height: 16px;
            }

            .difficulty-badge {
                color: white;
            }

            .exercise-content {
                padding: 24px;
                border-radius: 12px;
            }

            :host-context(.dark-theme) {
                .type-badge {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.7);
                }
            }
        `,
    ],
})
export class DynamicExerciseComponent implements OnInit {
    exercise: Exercise | null = null;
    ExerciseType = ExerciseType;

    constructor(
        private route: ActivatedRoute,
        private location: Location,
    ) {}

    goBack(): void {
        this.location.back();
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
                return '#4CAF50'; // Green
            case Difficulty.MEDIUM:
                return '#FF9800'; // Orange
            case Difficulty.HARD:
                return '#F44336'; // Red
            default:
                return '#9E9E9E'; // Gray
        }
    }

    ngOnInit() {
        this.route.data.subscribe((data) => {
            this.exercise = data['exercise'];
        });
    }
}
