import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Database, UpdateDatabaseDto } from '../../models/database.model';
import { DatabaseService } from '../../services/database.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-database-edit-dialog',
    templateUrl: './database-edit-dialog.component.html',
    styleUrls: ['./database-edit-dialog.component.scss']
})
export class DatabaseEditDialogComponent {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<DatabaseEditDialogComponent>,
        private databaseService: DatabaseService,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) private data: Database
    ) {
        this.form = this.fb.group({
            name: [data.name, [Validators.required, Validators.minLength(3)]],
            description: [data.description || '']
        });
    }

    onSubmit() {
        if (this.form.valid) {
            const updateDto: UpdateDatabaseDto = {
                name: this.form.get('name')?.value,
                description: this.form.get('description')?.value
            };

            this.databaseService.updateDatabase(this.data.id, updateDto).subscribe({
                next: () => {
                    this.dialogRef.close(true);
                },
                error: (error) => {
                    this.snackBar.open(
                        'Error updating database: ' + (error.error.message || 'Unknown error'),
                        'Close',
                        { duration: 3000 }
                    );
                }
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}