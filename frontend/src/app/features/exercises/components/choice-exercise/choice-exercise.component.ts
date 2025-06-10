import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Exercise, ExerciseType } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProgressService } from '../../../progress/services/progress.service';

@Component({
    selector: 'app-choice-exercise',
    templateUrl: './choice-exercise.component.html',
    styleUrls: ['./choice-exercise.component.scss'],
})
export class ChoiceExerciseComponent {
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
        private progressService: ProgressService
    ) {}

    toggleOption(optionId: number): void {
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
    }

    submitAnswer(): void {
        if (this.selectedOptions.length === 0 || this.isCorrectAnswer) return;
        if (this.exercise.type === ExerciseType.SINGLE_CHOICE && this.selectedOptions.length > 1)
            return;

        this.isSubmitting = true;
        this.submissionService
            .submitAnswer(this.exercise.id, this.selectedOptions.join(','))
            .subscribe({
                next: (submission) => {
                    this.isSubmitting = false;
                    this.isAnswered = true;
                    this.isCorrectAnswer = submission.isCorrect;
                    
                    if (submission.isCorrect) {
                        this.progressService.updateExerciseProgress(this.exercise.id, true).subscribe();
                        this.completed.emit(this.exercise.id);
                        // Markiere die Aufgabe lokal als erledigt
                        const completed = localStorage.getItem('completedExercises');
                        let arr: number[] = [];
                        try {
                            arr = completed ? JSON.parse(completed) : [];
                        } catch { arr = []; }
                        if (!arr.includes(this.exercise.id)) {
                            arr.push(this.exercise.id);
                            localStorage.setItem('completedExercises', JSON.stringify(arr));
                        }
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
