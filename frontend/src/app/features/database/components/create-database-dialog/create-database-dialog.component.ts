import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';

@Component({
    selector: 'app-create-database-dialog',
    template: `
        <h2 mat-dialog-title>Neue Datenbank erstellen</h2>
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
                    Erstellen
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
export class CreateDatabaseDialogComponent {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<CreateDatabaseDialogComponent>,
        private databaseService: DatabaseService
    ) {
        this.form = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            schemaSql: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.form.valid) {
            const formData = this.form.value;
            console.log('Sending data to server:', formData);
            
            this.databaseService.createDatabase(formData).subscribe({
                next: (database: Database) => {
                    console.log('Database created successfully:', database);
                    this.dialogRef.close(database);
                },
                error: (error: any) => {
                    console.error('Error creating database:', error);
                    console.error('Error details:', error.error);
                }
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
} 