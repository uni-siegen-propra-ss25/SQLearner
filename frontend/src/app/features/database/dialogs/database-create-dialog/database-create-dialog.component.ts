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
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<DatabaseCreateDialogComponent>,
        private databaseService: DatabaseService,
        private snackBar: MatSnackBar
    ) {
        this.form = this.fb.group({
            name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/)]],
            description: [''],
            schemaSql: ['']
        });
    }

    onSubmit(): void {
        if (this.form.valid && !this.isLoading) {
            this.isLoading = true;
            
            const formData = this.form.value;
            console.log('Creating database with data:', formData);

            this.databaseService.createDatabase(formData).subscribe({
                next: (database: any) => {
                    console.log('Database created successfully:', database);
                    this.snackBar.open('Datenbank erfolgreich erstellt', 'OK', { duration: 3000 });
                    this.dialogRef.close(database);
                },
                error: (error: any) => {
                    console.error('Error creating database:', error);
                    console.error('Error details:', error.error);
                    
                    let errorMessage = 'Fehler beim Erstellen der Datenbank';
                    
                    if (error.error?.message) {
                        errorMessage = error.error.message;
                    } else if (error.message) {
                        errorMessage = error.message;
                    } else if (error.status === 403) {
                        errorMessage = 'Sie haben keine Berechtigung, Datenbanken zu erstellen';
                    } else if (error.status === 400) {
                        errorMessage = 'Ungültige Daten für die Datenbankerstellung';
                    } else if (error.status === 500) {
                        errorMessage = 'Serverfehler beim Erstellen der Datenbank';
                    }
                    
                    this.snackBar.open(errorMessage, 'OK', { duration: 5000 });
                    this.isLoading = false;
                },
                complete: () => {
                    this.isLoading = false;
                }
            });
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
