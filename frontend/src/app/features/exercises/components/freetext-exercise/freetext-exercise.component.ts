import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Exercise } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressService } from '../../../progress/services/progress.service';

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
    @Output() completed = new EventEmitter<number>();

    constructor(
        private submissionService: SubmissionService,
        private snackBar: MatSnackBar,
        private progressService: ProgressService
    ) {}

    submitAnswer(): void {
        if (!this.answer.trim()) return;

        this.isSubmitting = true;
        this.submissionService.submitAnswer(this.exercise.id, this.answer).subscribe({
            next: (submission) => {
                this.isSubmitting = false;
                this.isCorrectAnswer = submission.isCorrect;
                this.snackBar.open('Answer submitted successfully', 'Close', { duration: 3000 });

                if (submission.isCorrect) {
                    // Aktualisiere den Fortschritt, wenn die Antwort korrekt ist
                    this.progressService.updateExerciseProgress(this.exercise.id, true).subscribe();
                    this.completed.emit(this.exercise.id);
                }

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
