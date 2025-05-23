import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Exercise, ExerciseType, Difficulty } from '../../models/exercise.model';

@Component({
  selector: 'app-exercise-dialog',
  templateUrl: './exercise-dialog.component.html',
  styleUrls: ['./exercise-dialog.component.scss']
})
export class ExerciseDialogComponent {
  exerciseForm: FormGroup;
  isEditing: boolean;
  exerciseTypes = Object.values(ExerciseType);
  difficultyLevels = Object.values(Difficulty);

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<ExerciseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly data: Partial<Exercise>
  ) {
    this.isEditing = !!data.id;
    this.exerciseForm = this.fb.group({
      title: [data.title || '', Validators.required],
      description: [data.description || '', Validators.required],
      type: [data.type || ExerciseType.SQL, Validators.required],
      difficulty: [data.difficulty || Difficulty.BEGINNER, Validators.required],
      sqlSolution: [data.sqlSolution || ''],
      llmPrompt: [data.llmPrompt || ''],
      choices: this.fb.array([]),
      topicId: [data.topicId],
      order: [data.order || 0]
    });

    // Initialize choices for multiple choice questions
    if (data.choices?.length) {
      data.choices.forEach(choice => this.addChoice(choice));
    } else {
      // Add two default empty choices
      this.addChoice();
      this.addChoice();
    }

    // Add validators based on exercise type
    this.exerciseForm.get('type')?.valueChanges.subscribe(type => {
      const sqlSolutionControl = this.exerciseForm.get('sqlSolution');
      if (type === ExerciseType.SQL) {
        sqlSolutionControl?.setValidators(Validators.required);
      } else {
        sqlSolutionControl?.clearValidators();
      }
      sqlSolutionControl?.updateValueAndValidity();
    });
  }

  get choices() {
    return this.exerciseForm.get('choices') as FormArray;
  }

  addChoice(choice?: { text: string; isCorrect: boolean }) {
    this.choices.push(this.fb.group({
      text: [choice?.text || '', Validators.required],
      isCorrect: [choice?.isCorrect || false]
    }));
  }

  removeChoice(index: number) {
    this.choices.removeAt(index);
  }

  onSubmit(): void {
    if (this.exerciseForm.valid) {
      const formValue = this.exerciseForm.value;
      
      // Clean up the form value based on exercise type
      if (formValue.type !== ExerciseType.SQL) {
        delete formValue.sqlSolution;
      }
      if (formValue.type !== ExerciseType.MULTIPLE_CHOICE) {
        delete formValue.choices;
      }

      this.dialogRef.close(formValue);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 