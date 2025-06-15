import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-create-database-dialog',
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
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: ['']
        });
    }

    onSubmit() {
        if (this.form.valid) {
            const formData = this.form.value;
            
            this.databaseService.createDatabase(formData).subscribe({
                next: (database: Database) => {
                    this.snackBar.open('Datenbank erfolgreich erstellt', 'Schließen', {
                        duration: 3000
                    });
                    this.dialogRef.close(database);
                },
                error: (error: any) => {
                    this.snackBar.open(
                        error.error?.message || 'Fehler beim Erstellen der Datenbank', 
                        'Schließen', 
                        { duration: 5000 }
                    );
                },
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}
