import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Exercise, ExerciseType, Difficulty, AnswerOption } from '../../models/exercise.model';
import { Database } from '../../../database/models/database.model';
import { DatabaseService } from '../../../database/services/database.service';

@Component({
  selector: 'app-exercise-dialog',
  templateUrl: './exercise-dialog.component.html',
  styleUrls: ['./exercise-dialog.component.scss']
})
export class ExerciseDialogComponent implements OnInit {
  exerciseForm!: FormGroup;
  isEditing: boolean;
  exerciseTypes = Object.values(ExerciseType);
  difficultyLevels = Object.values(Difficulty);
  databases: Database[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<ExerciseDialogComponent>,
    private readonly databaseService: DatabaseService,
    @Inject(MAT_DIALOG_DATA) private readonly data: Partial<Exercise>
  ) {
    this.isEditing = !!data.id;
    this.initForm();
  }

  ngOnInit() {
    this.loadDatabases();
    this.setupTypeValidation();
  }

  private initForm() {
    this.exerciseForm = this.fb.group({
      title: [this.data.title || '', Validators.required],
      description: [this.data.description || '', Validators.required],
      type: [this.data.type || ExerciseType.QUERY, Validators.required],
      difficulty: [this.data.difficulty || Difficulty.EASY, Validators.required],
      databaseId: [this.data.databaseId],
      querySolution: [this.data.querySolution],
      answers: this.fb.array([]),
      topicId: [this.data.topicId],
      order: [this.data.order || 0]
    });

    // Initialize answers for choice questions
    if (this.data.answers?.length) {
      this.data.answers.forEach(answer => this.addAnswer(answer));
    } else {
      // Add two default empty answers
      this.addAnswer();
      this.addAnswer();
    }
  }

  isCorrectDisabled(index: number): boolean {
    const type = this.exerciseForm.get('type')?.value;
    if (type !== ExerciseType.SINGLE_CHOICE) return false;
    
    if (index === 0) return false; // First option can always be correct

    // For single choice, disable if any other option is already correct
    return this.answers.controls.some((control, idx) => 
      idx !== index && control.get('isCorrect')?.value);
  }

  private setupTypeValidation() {
    this.exerciseForm.get('type')?.valueChanges.subscribe((type: ExerciseType) => {
      const databaseIdControl = this.exerciseForm.get('databaseId');
      const querySolutionControl = this.exerciseForm.get('querySolution');
      const answersControl = this.exerciseForm.get('answers') as FormArray;

      // Reset validations
      databaseIdControl?.clearValidators();
      querySolutionControl?.clearValidators();
      answersControl?.controls.forEach(control => control.clearValidators());

      if (type === ExerciseType.QUERY) {
        databaseIdControl?.setValidators([Validators.required]);
        querySolutionControl?.setValidators([Validators.required]);
      } else if (type === ExerciseType.SINGLE_CHOICE || type === ExerciseType.MULTIPLE_CHOICE) {
        answersControl?.controls.forEach(control => {
          control.get('text')?.setValidators([Validators.required]);
        });

        // For single choice, ensure exactly one answer is correct
        if (type === ExerciseType.SINGLE_CHOICE) {
          const correctAnswers = answersControl?.controls.filter(c => c.get('isCorrect')?.value);
          if (correctAnswers.length > 1) {
            // Keep only the first correct answer
            correctAnswers.slice(1).forEach(c => c.get('isCorrect')?.setValue(false));
          }
        }
      }

      // Update validation status
      databaseIdControl?.updateValueAndValidity();
      querySolutionControl?.updateValueAndValidity();
      answersControl?.controls.forEach(control => control.updateValueAndValidity());
    });
  }

  private loadDatabases() {
    this.databaseService.getDatabases().subscribe(
      databases => this.databases = databases
    );
  }

  get answers() {
    return this.exerciseForm.get('answers') as FormArray;
  }

  addAnswer(answer?: AnswerOption) {
    this.answers.push(this.fb.group({
      text: [answer?.text || '', Validators.required],
      isCorrect: [answer?.isCorrect || false],
      order: [answer?.order || this.answers.length]
    }));
  }

  removeAnswer(index: number) {
    this.answers.removeAt(index);
    // Update order of remaining answers
    this.answers.controls.forEach((control, idx) => {
      control.get('order')?.setValue(idx);
    });
  }

  onSubmit(): void {
    if (this.exerciseForm.valid) {
      const formValue = { ...this.exerciseForm.value };
      
      // Clean up the form value based on exercise type
      if (formValue.type !== ExerciseType.QUERY) {
        delete formValue.databaseId;
        delete formValue.querySolution;
      }
      if (formValue.type !== ExerciseType.SINGLE_CHOICE && formValue.type !== ExerciseType.MULTIPLE_CHOICE) {
        delete formValue.answers;
      } else if (formValue.type === ExerciseType.SINGLE_CHOICE) {
        // Ensure only one answer is marked as correct
        const correctAnswers = formValue.answers.filter((a: any) => a.isCorrect);
        if (correctAnswers.length > 1) {
          formValue.answers = formValue.answers.map((a: any, i: number) => ({
            ...a,
            isCorrect: i === correctAnswers[0].order
          }));
        }
      }

      this.dialogRef.close(formValue);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}