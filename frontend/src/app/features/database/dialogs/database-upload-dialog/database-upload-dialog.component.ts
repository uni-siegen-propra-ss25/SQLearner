import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DatabaseService } from '../../services/database.service';
import { Database } from '../../models/database.model';

@Component({
    selector: 'app-upload-database-dialog',
    templateUrl: './database-upload-dialog.component.html',
    styleUrls: [],
})
export class DatabaseUploadDialogComponent {
    form: FormGroup;
    selectedFile: File | null = null;
    fileInput: any;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<DatabaseUploadDialogComponent>,
        private databaseService: DatabaseService,
    ) {
        this.form = this.fb.group({
            name: ['', Validators.required],
            description: [''],
        });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.selectedFile = input.files[0];
        }
    }

    onFileDrop(event: DragEvent): void {
        event.preventDefault();
        if (event.dataTransfer && event.dataTransfer.files.length > 0) {
            const file = event.dataTransfer.files[0];
            if (file.name.endsWith('.sql')) {
                this.selectedFile = file;
            }
        }
    }

    removeFile(event: Event): void {
        event.stopPropagation();
        this.selectedFile = null;
        if (this.fileInput) {
            this.fileInput.nativeElement.value = '';
        }
    }

    onSubmit() {
        if (this.form.valid && this.selectedFile) {
            this.databaseService.uploadDatabase(this.selectedFile).subscribe({
                next: (database: Database) => {
                    this.dialogRef.close(database);
                },
                error: (error: any) => {
                    console.error('Error uploading database:', error);
                },
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}