import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Exercise, ExerciseType } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressService } from '../../../progress/services/progress.service';

@Component({
    selector: 'app-choice-exercise',
    templateUrl: './choice-exercise.component.html',
    styleUrls: ['./choice-exercise.component.scss'],
})
export class ChoiceExerciseComponent implements OnInit {
    @Input() exercise!: Exercise;
    @Output() completed = new EventEmitter<number>();
    selectedOptions: number[] = [];
    isSubmitting = false;
    isAnswered = false;
    isCorrectAnswer = false;
    showFeedback = false;
    feedback: string | null = null;
    ExerciseType = ExerciseType;

    constructor(
        private submissionService: SubmissionService,
        private snackBar: MatSnackBar,
        private progressService: ProgressService,
    ) {}

    ngOnInit(): void {
        // Check if the user has already answered this exercise correctly
        this.isCorrectAnswer = this.progressService.isCorrectAnswer(this.exercise.id);
        this.isAnswered = this.isCorrectAnswer;
    }

    toggleOption(optionId: number): void {
        const index = this.selectedOptions.indexOf(optionId);
        if (index > -1) {
            this.selectedOptions.splice(index, 1);
        } else {
            if (this.exercise.type === ExerciseType.SINGLE_CHOICE) {
                this.selectedOptions = [optionId];
            } else {
                // Vermeide Duplikate bei Multiple-Choice
                if (!this.selectedOptions.includes(optionId)) {
                    this.selectedOptions.push(optionId);
                }
            }
        }
    }

    /**
     * Submits the selected answer(s) for the current exercise.
     * Handles validation, submission, feedback, and completion event.
     * @returns {void}
     */
    submitAnswer(): void {
        if (this.selectedOptions.length === 0 || this.isCorrectAnswer) return;
        if (this.exercise.type === ExerciseType.SINGLE_CHOICE && this.selectedOptions.length > 1)
            return;

        this.isSubmitting = true; // Sortiere die ausgewählten IDs für konsistente Verarbeitung
        const sortedOptions = [...this.selectedOptions].sort((a, b) => a - b);
        this.submissionService.submitAnswer(this.exercise.id, sortedOptions.join(',')).subscribe({
            next: (submission) => {
                this.isSubmitting = false;
                this.isAnswered = true;
                this.isCorrectAnswer = submission.isCorrect;
                if (submission.isCorrect) {
                    this.completed.emit(this.exercise.id);
                    // Record completion through the progress service
                    this.progressService.recordCompletion(this.exercise.id);
                }

                const message = submission.feedback || 'Answer submitted successfully';
                this.snackBar.open(message, 'Close', {
                    duration: 4000,
                });
            },
            error: (error) => {
                this.isSubmitting = false;
                this.snackBar.open(error.message || 'Failed to submit answer', 'Close', {
                    duration: 3000,
                });
            },
        });
    }
}
