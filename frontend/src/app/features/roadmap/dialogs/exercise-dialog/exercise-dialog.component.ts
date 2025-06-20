import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Exercise, ExerciseType, Difficulty, AnswerOption } from '../../models/exercise.model';
import { Database } from 'app/features/database/models/database.model';
import { DatabaseService } from 'app/features/database/services/database.service';

@Component({
    selector: 'app-exercise-dialog',
    templateUrl: './exercise-dialog.component.html',
    styleUrls: ['./exercise-dialog.component.scss'],
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
        private readonly snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) private readonly data: Partial<Exercise>,
    ) {
        this.isEditing = !!data.id;
        this.initForm();
    }

    ngOnInit() {
        this.loadDatabases();
        this.setupTypeValidation();
    }

    private initForm() {
        const type = this.data.type || ExerciseType.QUERY;
        const validators = type === ExerciseType.QUERY ? [Validators.required] : [];

        this.exerciseForm = this.fb.group({
            title: [this.data.title || '', Validators.required],
            description: [this.data.description || '', Validators.required],
            type: [type, Validators.required],
            difficulty: [this.data.difficulty || Difficulty.EASY, Validators.required],
            databaseId: [this.data.databaseId || null, validators],
            querySolution: [this.data.querySolution || null, validators],
            answers: this.fb.array([]),
            topicId: [this.data.topicId],
            order: [this.data.order || 0],
        });

        // Initialize answers for choice questions
        if (this.data.answers?.length) {
            this.data.answers.forEach((answer) => this.addAnswer(answer));
        }
    }

    isCorrectDisabled(index: number): boolean {
        const type = this.exerciseForm.get('type')?.value;
        if (type !== ExerciseType.SINGLE_CHOICE) return false;

        if (index === 0) return false; // First option can always be correct

        // For single choice, disable if any other option is already correct
        return this.answers.controls.some(
            (control, idx) => idx !== index && control.get('isCorrect')?.value,
        );
    }

    private setupTypeValidation() {
        this.exerciseForm.get('type')?.valueChanges.subscribe((type: ExerciseType) => {
            const databaseIdControl = this.exerciseForm.get('databaseId');
            const querySolutionControl = this.exerciseForm.get('querySolution');
            const answersControl = this.exerciseForm.get('answers') as FormArray;

            // Reset all controls and their validators
            databaseIdControl?.clearValidators();
            databaseIdControl?.setValue(null);
            querySolutionControl?.clearValidators();
            querySolutionControl?.setValue(null);

            // Clear answers array for non-choice exercises
            if (type !== ExerciseType.SINGLE_CHOICE && type !== ExerciseType.MULTIPLE_CHOICE) {
                while (answersControl.length) {
                    answersControl.removeAt(0);
                }
            } else {
                // For choice exercises, ensure we have at least 2 answers
                if (answersControl.length < 2) {
                    while (answersControl.length < 2) {
                        this.addAnswer();
                    }
                }
            }

            // Set up validators based on type
            if (type === ExerciseType.QUERY) {
                databaseIdControl?.setValidators([Validators.required]);
                querySolutionControl?.setValidators([Validators.required]);
            } else if (
                type === ExerciseType.SINGLE_CHOICE ||
                type === ExerciseType.MULTIPLE_CHOICE
            ) {
                // Ensure we have at least two answers for choice exercises
                if (answersControl.length === 0) {
                    this.addAnswer();
                    this.addAnswer();
                }

                answersControl.controls.forEach((control) => {
                    control.get('text')?.setValidators([Validators.required]);
                });

                // For single choice, ensure exactly one answer is correct
                if (type === ExerciseType.SINGLE_CHOICE) {
                    const correctAnswers = answersControl.controls.filter(
                        (c) => c.get('isCorrect')?.value,
                    );
                    if (correctAnswers.length > 1) {
                        // Keep only the first correct answer
                        correctAnswers.slice(1).forEach((c) => c.get('isCorrect')?.setValue(false));
                    }
                }
            }
            // No additional validation for FREETEXT type

            // Update validation status
            databaseIdControl?.updateValueAndValidity();
            querySolutionControl?.updateValueAndValidity();
            if (answersControl.length > 0) {
                answersControl.controls.forEach((control) => {
                    control.get('text')?.updateValueAndValidity();
                });
            }
        });
    }

    private loadDatabases() {
        this.databaseService
            .getAllDatabases()
            .subscribe((databases: Database[]) => (this.databases = databases));
    }

    get answers() {
        return this.exerciseForm.get('answers') as FormArray;
    }

    addAnswer(answer?: AnswerOption) {
        const group = this.fb.group({
            text: [answer?.text || '', Validators.required],
            isCorrect: [answer?.isCorrect || false],
            order: [answer?.order || this.answers.length],
        });

        // For single choice, if this is the first answer and no other answers are correct,
        // make it correct by default
        const type = this.exerciseForm.get('type')?.value;
        if (type === ExerciseType.SINGLE_CHOICE && this.answers.length === 0) {
            group.get('isCorrect')?.setValue(true);
        }

        this.answers.push(group);
    }

    removeAnswer(index: number) {
        this.answers.removeAt(index);
        // Update order of remaining answers
        this.answers.controls.forEach((control, idx) => {
            control.get('order')?.setValue(idx);
        });
    }

    private validateForm(): { valid: boolean; error?: string } {
        const formValue = this.exerciseForm.value;
        const type = formValue.type;

        if (!this.exerciseForm.valid) {
            return { valid: false, error: 'Please fill out all required fields.' };
        }

        if (type === ExerciseType.MULTIPLE_CHOICE || type === ExerciseType.SINGLE_CHOICE) {
            if (!formValue.answers || formValue.answers.length < 2) {
                return { valid: false, error: 'Choice exercises must have at least two answer options.' };
            }

            const correctAnswers = formValue.answers.filter((a: any) => a.isCorrect) || [];

            if (type === ExerciseType.SINGLE_CHOICE && correctAnswers.length !== 1) {
                return { valid: false, error: 'Single choice exercises must have exactly one correct answer.' };
            }

            if (type === ExerciseType.MULTIPLE_CHOICE && correctAnswers.length === 0) {
                return { valid: false, error: 'Multiple choice exercises must have at least one correct answer.' };
            }
        }

        return { valid: true };
    }

    onSubmit(): void {
        const validation = this.validateForm();
        if (!validation.valid) {
            this.snackBar.open(validation.error || 'Form validation failed', 'Close', { duration: 5000 });
            return;
        }

        const formValue = { ...this.exerciseForm.value };

        // Clean up the form value based on exercise type
        if (formValue.type !== ExerciseType.QUERY) {
            delete formValue.databaseId;
            delete formValue.querySolution;
        }
        if (
            formValue.type !== ExerciseType.SINGLE_CHOICE &&
            formValue.type !== ExerciseType.MULTIPLE_CHOICE
        ) {
            delete formValue.answers;
        }

        this.dialogRef.close(formValue);
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSingleChoiceSelect(selectedIndex: number) {
        // Uncheck all other answers
        this.answers.controls.forEach((control, index) => {
            control.get('isCorrect')?.setValue(index === selectedIndex);
        });
    }
}
