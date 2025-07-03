import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Database } from 'app/features/database/models/database.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-exercise-ai-generation-dialog',
  templateUrl: './exercise-ai-generation-dialog.component.html',
  styleUrls: ['./exercise-ai-generation-dialog.component.scss']
})
export class ExerciseAIGenerationDialogComponent {
  generationForm: FormGroup;
  isLoading = false;
  error: string | null = null;
  result: { title: string; description: string; solution: string } | null = null;

  syntaxElements = [
    'SELECT', 'WHERE', 'JOIN', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'DISTINCT', 'UNION', 'IN', 'EXISTS', 'COUNT', 'AVG', 'SUM', 'MIN', 'MAX'
  ];
  sqlConcepts = [
    'Aggregation', 'Subquery', 'Window Function', 'Set Operation', 'Self Join', 'Outer Join', 'Inner Join', 'Case', 'Null Handling', 'Grouping Sets'
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialogRef: MatDialogRef<ExerciseAIGenerationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { databases: Database[], defaultType: string, defaultDifficulty: string }
  ) {
    this.generationForm = this.fb.group({
      type: [data.defaultType || 'QUERY', Validators.required],
      difficulty: [data.defaultDifficulty || 'EASY', Validators.required],
      databaseId: [null],
      syntaxElements: [[]],
      sqlConcepts: [[]]
    });
  }

  onTypeChange() {
    if (this.generationForm.get('type')?.value !== 'QUERY') {
      this.generationForm.get('databaseId')?.setValue(null);
      this.generationForm.get('syntaxElements')?.setValue([]);
      this.generationForm.get('sqlConcepts')?.setValue([]);
    }
  }

  generate() {
    this.isLoading = true;
    this.error = null;
    this.result = null;
    const payload = { ...this.generationForm.value };
    this.http.post<{ title: string; description: string; solution: string }>(
      '/api/exercises/generate',
      payload
    ).subscribe({
      next: (res) => {
        this.result = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Fehler bei der Generierung.';
        this.isLoading = false;
      }
    });
  }

  useResult() {
    if (this.result) {
      this.dialogRef.close(this.result);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
