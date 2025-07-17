import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Database } from 'app/features/database/models/database.model';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-exercise-ai-generation-dialog',
    templateUrl: './exercise-ai-generation-dialog.component.html',
    styleUrls: ['./exercise-ai-generation-dialog.component.scss'],
})
export class ExerciseAIGenerationDialogComponent {
    private readonly baseUrl = environment.apiUrl;
    
    generationForm: FormGroup;
    isLoading = false;
    error: string | null = null;

    syntaxElements = [
        'SELECT',
        'WHERE',
        'JOIN',
        'GROUP BY',
        'ORDER BY',
        'HAVING',
        'LIMIT',
        'DISTINCT',
        'UNION',
        'IN',
        'EXISTS',
        'COUNT',
        'AVG',
        'SUM',
        'MIN',
        'MAX',
    ];
    sqlConcepts = [
        'Aggregation',
        'Subquery',
        'Window Function',
        'Set Operation',
        'Self Join',
        'Outer Join',
        'Inner Join',
        'Case',
        'Null Handling',
        'Grouping Sets',
    ];

    constructor(
        private fb: FormBuilder,
        private http: HttpClient,
        private dialogRef: MatDialogRef<ExerciseAIGenerationDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        public data: { databases: Database[]; defaultType: string; defaultDifficulty: string },
    ) {
        this.generationForm = this.fb.group({
            difficulty: [data.defaultDifficulty || 'EASY', Validators.required],
            databaseId: [null, Validators.required],
            syntaxElements: [[]],
            sqlConcepts: [[]],
        });
    }

    generate() {
        this.isLoading = true;
        this.error = null;
        const payload = { ...this.generationForm.value, type: 'QUERY' };
        this.http
            .post<{
                title: string;
                description: string;
                solution: string;
            }>(`${this.baseUrl}/exercises/generate`, payload)
            .subscribe({
                next: (res) => {
                    this.isLoading = false;
                    // Übergib zusätzlich difficulty und databaseId zurück
                    this.dialogRef.close({
                        ...res,
                        difficulty: this.generationForm.get('difficulty')?.value,
                        databaseId: this.generationForm.get('databaseId')?.value,
                    });
                },
                error: (err) => {
                    this.error = err?.error?.message || 'Fehler bei der Generierung.';
                    this.isLoading = false;
                },
            });
    }

    close() {
        this.dialogRef.close();
    }
}
