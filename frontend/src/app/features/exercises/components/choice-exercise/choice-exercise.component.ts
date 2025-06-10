import { Component, Input } from '@angular/core';
import { Exercise, ExerciseType } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-choice-exercise',
    templateUrl: './choice-exercise.component.html',
    styleUrls: ['./choice-exercise.component.scss'],
})
export class ChoiceExerciseComponent {
    @Input() exercise!: Exercise;    selectedOptions: number[] = [];
    isSubmitting = false;
    isAnswered = false;
    isCorrectAnswer = false;
    showFeedback = false;
    feedback: string | null = null;
    ExerciseType = ExerciseType;

    constructor(
        private submissionService: SubmissionService,
        private snackBar: MatSnackBar,
    ) {}    toggleOption(optionId: number): void {
        if (this.isCorrectAnswer) return; // Only prevent changes if answer was correct
        
        const index = this.selectedOptions.indexOf(optionId);
        if (index > -1) {
            this.selectedOptions.splice(index, 1);
        } else {
            if (this.exercise.type === ExerciseType.SINGLE_CHOICE) {
                this.selectedOptions = [optionId];
            } else {
                this.selectedOptions.push(optionId);
            }
        }
    }    submitAnswer(): void {
        if (this.selectedOptions.length === 0 || this.isCorrectAnswer) return; // Only prevent if correct answer already submitted
        if (this.exercise.type === ExerciseType.SINGLE_CHOICE && this.selectedOptions.length > 1)
            return;

        this.isSubmitting = true;
        this.submissionService
            .submitAnswer(this.exercise.id, this.selectedOptions.join(','))
            .subscribe({
                next: (submission) => {
                    this.isSubmitting = false;
                    this.isAnswered = true;
                    this.isCorrectAnswer = submission.isCorrect; // Track if answer was correct
                    
                    // Backend-Feedback anzeigen statt generischer Nachricht
                    const message = submission.feedback || 'Answer submitted successfully';
                    this.snackBar.open(message, 'Close', {
                        duration: 4000, // Etwas länger für Feedback
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
