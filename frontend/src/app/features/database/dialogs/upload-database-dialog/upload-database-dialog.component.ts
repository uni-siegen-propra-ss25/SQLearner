import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';

@Component({
    selector: 'app-upload-database-dialog',
    templateUrl: './upload-database-dialog.component.html',
    styleUrls: ['./upload-database-dialog.component.scss']
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