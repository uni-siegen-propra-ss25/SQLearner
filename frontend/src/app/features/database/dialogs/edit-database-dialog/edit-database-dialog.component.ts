import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';

@Component({
    selector: 'app-edit-database-dialog',
    templateUrl: './edit-database-dialog.component.html',
    styleUrls: ['./edit-database-dialog.component.scss']
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