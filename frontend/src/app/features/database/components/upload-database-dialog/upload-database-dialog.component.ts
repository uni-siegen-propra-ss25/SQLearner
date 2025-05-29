import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';

@Component({
    selector: 'app-upload-database-dialog',
    template: `
        <h2 mat-dialog-title>SQL-Datei hochladen</h2>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-dialog-content>
                <mat-form-field appearance="fill" class="full-width">
                    <mat-label>Name</mat-label>
                    <input matInput formControlName="name" required>
                    <mat-error *ngIf="form.get('name')?.hasError('required')">
                        Name ist erforderlich
                    </mat-error>
                </mat-form-field>

                <mat-form-field appearance="fill" class="full-width">
                    <mat-label>Beschreibung</mat-label>
                    <textarea matInput formControlName="description" rows="3"></textarea>
                </mat-form-field>

                <div class="file-upload">
                    <input type="file" (change)="onFileSelected($event)" accept=".sql" #fileInput>
                    <button type="button" mat-stroked-button (click)="fileInput.click()">
                        SQL-Datei auswählen
                    </button>
                    <span *ngIf="selectedFile">{{ selectedFile.name }}</span>
                </div>
            </mat-dialog-content>

            <mat-dialog-actions align="end">
                <button mat-button type="button" (click)="onCancel()">Abbrechen</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="!form.valid || !selectedFile">
                    Hochladen
                </button>
            </mat-dialog-actions>
        </form>
    `,
    styles: [`
        .full-width {
            width: 100%;
            margin-bottom: 16px;
        }
        .file-upload {
            margin: 16px 0;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        input[type="file"] {
            display: none;
        }
    `]
})
export class UploadDatabaseDialogComponent {
    form: FormGroup;
    selectedFile: File | null = null;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<UploadDatabaseDialogComponent>,
        private databaseService: DatabaseService
    ) {
        this.form = this.fb.group({
            name: ['', Validators.required],
            description: ['']
        });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.selectedFile = input.files[0];
        }
    }

    onSubmit() {
        if (this.form.valid && this.selectedFile) {
            this.databaseService.uploadSqlFile(this.selectedFile).subscribe({
                next: (database: Database) => {
                    this.dialogRef.close(database);
                },
                error: (error: any) => {
                    console.error('Error uploading database:', error);
                }
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
} 