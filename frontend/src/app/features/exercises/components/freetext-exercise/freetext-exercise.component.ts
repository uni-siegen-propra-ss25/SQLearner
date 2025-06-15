import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Exercise } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-freetext-exercise',
    templateUrl: './freetext-exercise.component.html',
    styleUrls: ['./freetext-exercise.component.scss'],
})
export class FreetextExerciseComponent {
    @Input() exercise!: Exercise;
    answer = '';
    isSubmitting = false;
    showFeedback = false;
    feedback: string | null = null;
    isCorrectAnswer = false;
    @Output() completed = new EventEmitter<number>();    constructor(
        private submissionService: SubmissionService,
        private snackBar: MatSnackBar
    ) {}

    submitAnswer(): void {
        if (!this.answer.trim()) return;

        this.isSubmitting = true;        this.submissionService.submitAnswer(this.exercise.id, this.answer).subscribe({
            next: (submission) => {
                this.isSubmitting = false;
                this.isCorrectAnswer = submission.isCorrect;
                
                // Display feedback from submission response (same as choice-exercise and query-exercise)
                const message = submission.feedback || 'Answer submitted successfully';
                this.snackBar.open(message, 'Close', { duration: 4000 });                if (submission.isCorrect) {
                    this.completed.emit(this.exercise.id);
                }

                // Store feedback for potential display in UI
                if (submission.feedback) {
                    this.feedback = submission.feedback;
                    this.showFeedback = true;
                }
            },
            error: (error) => {
                this.isSubmitting = false;
                this.snackBar.open(error.message || 'Failed to submit answer', 'Close', {
                    duration: 3000,
                });            },
        });
    }
}
