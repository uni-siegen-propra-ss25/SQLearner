import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';

@Component({
    selector: 'app-edit-database-dialog',
    template: `
        <h2 mat-dialog-title>Datenbank bearbeiten</h2>
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

                <mat-form-field appearance="fill" class="full-width">
                    <mat-label>SQL-Schema</mat-label>
                    <textarea matInput formControlName="schemaSql" rows="10" required></textarea>
                    <mat-error *ngIf="form.get('schemaSql')?.hasError('required')">
                        SQL-Schema ist erforderlich
                    </mat-error>
                </mat-form-field>
            </mat-dialog-content>

            <mat-dialog-actions align="end">
                <button mat-button type="button" (click)="onCancel()">Abbrechen</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="!form.valid">
                    Speichern
                </button>
            </mat-dialog-actions>
        </form>
    `,
    styles: [`
        .full-width {
            width: 100%;
            margin-bottom: 16px;
        }
    `]
})
export class EditDatabaseDialogComponent {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<EditDatabaseDialogComponent>,
        private databaseService: DatabaseService,
        @Inject(MAT_DIALOG_DATA) public data: Database
    ) {
        this.form = this.fb.group({
            name: [data.name, Validators.required],
            description: [data.description],
            schemaSql: [data.schemaSql, Validators.required]
        });
    }

    onSubmit() {
        if (this.form.valid) {
            this.databaseService.updateDatabase(this.data.id, this.form.value).subscribe({
                next: (database: Database) => {
                    this.dialogRef.close(database);
                },
                error: (error: any) => {
                    console.error('Error updating database:', error);
                }
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
} 