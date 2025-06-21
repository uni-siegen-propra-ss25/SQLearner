import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-database-create-dialog',
    templateUrl: './database-create-dialog.component.html',
    styleUrls: ['./database-create-dialog.component.scss'],
})
export class DatabaseCreateDialogComponent {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<DatabaseCreateDialogComponent>,
        private databaseService: DatabaseService,
        private snackBar: MatSnackBar
    ) {
        this.form = this.fb.group({
            name: ['', [Validators.required]],
            description: [''],
            schemaSql: ['']
        });
    }

    onSubmit(): void {
        if (this.form.valid) {
            this.databaseService.createDatabase(this.form.value).subscribe({
                next: (database) => {
                    this.snackBar.open('Datenbank erfolgreich erstellt', 'OK', { duration: 3000 });
                    this.dialogRef.close(database);
                },
                error: (error) => {
                    console.error('Error creating database:', error);
                    this.snackBar.open(error.error.message || 'Fehler beim Erstellen der Datenbank', 'OK', {
                        duration: 5000
                    });
                }
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
