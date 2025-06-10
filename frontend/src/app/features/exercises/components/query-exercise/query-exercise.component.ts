import { Component, Input, ViewChild } from '@angular/core';
import { Exercise } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SqlEditorComponent } from '../../../../shared/components/sql-editor/sql-editor.component';

@Component({
    selector: 'app-query-exercise',
    templateUrl: './query-exercise.component.html',
    styleUrls: ['./query-exercise.component.scss'],
})
export class QueryExerciseComponent {
    @Input() exercise!: Exercise;
    @ViewChild(SqlEditorComponent) sqlEditor!: SqlEditorComponent;
    
    sqlQuery = '';
    queryResult: any = null;
    isLoading = false;
    showFeedback = false;
    feedback: string | null = null;
    currentView: 'schema' | 'result' = 'result';
    isDarkMode = false; // Should be synced with your app's theme service

    // Pagination variables
    pageSize = 10;
    pageSizeOptions = [5, 10, 25, 100];
    pageIndex = 0;
    
    constructor(
        private submissionService: SubmissionService,
        private snackBar: MatSnackBar,
    ) {}

    onSqlChange(newValue: string) {
        this.sqlQuery = newValue;
    }

    onEditorReady() {
        // You can perform any initialization that requires the editor to be ready
        if (this.isDarkMode) {
            this.sqlEditor.setTheme('dark');
        }
    }

    toggleTheme(isDark: boolean) {
        this.isDarkMode = isDark;
        this.sqlEditor?.setTheme(isDark ? 'dark' : 'light');
    }

    runQuery(): void {
        if (!this.sqlQuery.trim()) return;

        this.isLoading = true;
        this.submissionService.runQuery(this.exercise.id, this.sqlQuery).subscribe({
            next: (result) => {
                this.queryResult = result;
                this.isLoading = false;
                this.currentView = 'result';
            },
            error: (error) => {
                this.isLoading = false;
                this.queryResult = null;
                const errorMessage = error.error?.detail || error.error?.message || error.message || 'Failed to run query';
                this.snackBar.open(errorMessage, 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
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
                this.feedback = 'Feedback is being generated...';
            },
        });
    }

    toggleFeedback(): void {
        this.showFeedback = !this.showFeedback;
    }

    onPageChange(e: any): void {
        this.pageIndex = e.pageIndex;
        this.pageSize = e.pageSize;
    }

    get paginatedRows(): any[] {
        if (!this.queryResult?.rows) return [];
        const start = this.pageIndex * this.pageSize;
        return this.queryResult.rows.slice(start, start + this.pageSize);
    }

    /**
     * Requests AI-powered feedback for the current SQL query.
     */
    getAiFeedback(): void {
        if (!this.sqlQuery.trim()) {
            this.snackBar.open('Bitte geben Sie zuerst eine SQL Query ein', 'Close', {
                duration: 3000,
            });
            return;
        }

        this.isLoading = true;
        this.submissionService.getSqlQueryFeedback(this.exercise.id, this.sqlQuery).subscribe({
            next: (response) => {
                this.isLoading = false;
                this.feedback = response.feedback || 'KI-Feedback wurde generiert.';
                this.showFeedback = true;
                this.snackBar.open('KI-Feedback erfolgreich erhalten', 'Close', { duration: 3000 });
            },
            error: (error) => {
                this.isLoading = false;
                const errorMessage = error.error?.message || error.message || 'Fehler beim Abrufen des KI-Feedbacks';
                this.snackBar.open(errorMessage, 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                });
            },
        });
    }
}
