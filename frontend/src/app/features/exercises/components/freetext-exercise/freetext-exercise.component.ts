import { Component, Input } from '@angular/core';
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

    constructor(
        private submissionService: SubmissionService,
        private snackBar: MatSnackBar,
    ) {}

    submitAnswer(): void {
        if (!this.answer.trim()) return;

        this.isSubmitting = true;
        this.submissionService.submitAnswer(this.exercise.id, this.answer).subscribe({
            next: (submission) => {
                this.isSubmitting = false;
                this.snackBar.open('Answer submitted successfully', 'Close', { duration: 3000 });

                // Get feedback if available
                if (submission.id) {
                    this.loadFeedback(submission.id);
                }
            },
            error: (error) => {
                this.isSubmitting = false;
                this.snackBar.open(error.message || 'Failed to submit answer', 'Close', {
                    duration: 3000,
                });
            },
        });
    }

    private loadFeedback(submissionId: number): void {
        this.submissionService.getFeedback(submissionId).subscribe({
            next: (feedback) => {
                this.feedback = feedback;
                this.showFeedback = true;
            },
            error: () => {
                // Silently fail, feedback might not be available yet
                this.feedback = 'Feedback is being generated...';
            },
        });
    }
}
