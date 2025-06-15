import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-edit-database-dialog',
    templateUrl: './database-edit-dialog.component.html',
    styleUrls: ['./database-edit-dialog.component.scss'],
})
export class DatabaseEditDialogComponent {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<DatabaseEditDialogComponent>,
        private databaseService: DatabaseService,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: Database,
    ) {
        this.form = this.fb.group({
            name: [data.name, [Validators.required, Validators.minLength(3)]],
            description: [data.description]
        });
    }

    onSubmit() {
        if (this.form.valid) {
            const formData = this.form.value;
            
            this.databaseService.updateDatabase(this.data.id, formData).subscribe({
                next: (database: Database) => {
                    this.snackBar.open('Datenbank erfolgreich aktualisiert', 'Schließen', {
                        duration: 3000
                    });
                    this.dialogRef.close(database);
                },
                error: (error: any) => {
                    this.snackBar.open(
                        error.error?.message || 'Fehler beim Aktualisieren der Datenbank', 
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
