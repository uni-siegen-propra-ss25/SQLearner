import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Exercise } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressService } from '../../../progress/services/progress.service';

@Component({
    selector: 'app-freetext-exercise',
    templateUrl: './freetext-exercise.component.html',
    styleUrls: ['./freetext-exercise.component.scss'],
})
export class FreetextExerciseComponent implements OnInit {
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
        private progressService: ProgressService,
    ) {}

    ngOnInit(): void {
        // Check if the user has already answered this exercise correctly
        this.isCorrectAnswer = this.progressService.isCorrectAnswer(this.exercise.id);
    }

    submitAnswer(): void {
        if (!this.answer.trim()) return;

        this.isSubmitting = true;
        this.submissionService.submitAnswer(this.exercise.id, this.answer).subscribe({
            next: (submission) => {
                this.isSubmitting = false;
                this.isCorrectAnswer = submission.isCorrect;
                if (submission.isCorrect) {
                    this.completed.emit(this.exercise.id);
                    // Record completion through the progress service
                    this.progressService.recordCompletion(this.exercise.id);
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
                });
            },
        });
    }
}
