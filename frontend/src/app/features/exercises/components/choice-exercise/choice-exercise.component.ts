import { Component, Input } from '@angular/core';
import { Exercise, ExerciseType } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-choice-exercise',
  templateUrl: './choice-exercise.component.html',
  styleUrls: ['./choice-exercise.component.scss']
})
export class ChoiceExerciseComponent {
  @Input() exercise!: Exercise;
  selectedOptions: number[] = [];
  isSubmitting = false;
  showFeedback = false;
  feedback: string | null = null;
  ExerciseType = ExerciseType;

  constructor(
    private submissionService: SubmissionService,
    private snackBar: MatSnackBar
  ) {}

  toggleOption(optionId: number): void {
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
    if (this.selectedOptions.length === 0) return;
    if (this.exercise.type === ExerciseType.SINGLE_CHOICE && this.selectedOptions.length > 1) return;
    
    this.isSubmitting = true;
    this.submissionService.submitAnswer(this.exercise.id, this.selectedOptions.join(','))
      .subscribe({
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
          this.snackBar.open(
            error.message || 'Failed to submit answer',
            'Close',
            { duration: 3000 }
          );
        }
      });
  }

  private loadFeedback(submissionId: number): void {
    this.submissionService.getFeedback(submissionId)
      .subscribe({
        next: (feedback) => {
          this.feedback = feedback;
          this.showFeedback = true;
        },
        error: () => {
          // Silently fail, feedback might not be available yet
          this.feedback = 'Feedback is being generated...';
        }
      });
  }
}
