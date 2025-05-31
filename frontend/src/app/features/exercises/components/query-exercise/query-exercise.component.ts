import { Component, Input } from '@angular/core';
import { Exercise } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
    selector: 'app-query-exercise',
    templateUrl: './query-exercise.component.html',
    styleUrls: ['./query-exercise.component.scss'],
})
export class QueryExerciseComponent {
    @Input() exercise!: Exercise;
    sqlQuery = '';
    queryResult: any = null;
    isLoading = false;
    showFeedback = false;
    feedback: string | null = null;
    currentView: 'schema' | 'result' = 'result';

    constructor(
        private submissionService: SubmissionService,
        private snackBar: MatSnackBar,
    ) {}

    runQuery(): void {
        if (!this.sqlQuery.trim()) return;

        this.isLoading = true;
        this.submissionService.runQuery(this.exercise.id, this.sqlQuery).subscribe({
            next: (result) => {
                this.queryResult = result;
                this.isLoading = false;
            },
            error: (error) => {
                this.isLoading = false;
                this.snackBar.open(error.message || 'Failed to run query', 'Close', {
                    duration: 3000,
                });
            },
        });
    }

    submitQuery(): void {
        if (!this.sqlQuery.trim()) return;

        this.isLoading = true;
        this.submissionService.submitAnswer(this.exercise.id, this.sqlQuery).subscribe({
            next: (submission) => {
                this.isLoading = false;
                this.snackBar.open('Answer submitted successfully', 'Close', { duration: 3000 });

                // Get feedback if available
                if (submission.id) {
                    this.loadFeedback(submission.id);
                }
            },
            error: (error) => {
                this.isLoading = false;
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

    toggleFeedback(): void {
        this.showFeedback = !this.showFeedback;
    }
}
