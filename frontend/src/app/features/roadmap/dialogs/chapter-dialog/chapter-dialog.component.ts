import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Chapter } from '../../models/chapter.model';

@Component({
    selector: 'app-chapter-dialog',
    templateUrl: './chapter-dialog.component.html',
    styleUrls: ['./chapter-dialog.component.scss'],
})
export class ChapterDialogComponent {
    chapterForm: FormGroup;
    isEditing: boolean;

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<ChapterDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: Partial<Chapter>,
    ) {
        this.isEditing = !!data.id;
        this.chapterForm = this.fb.group({
            title: [data.title || '', Validators.required],
            description: [data.description || '', Validators.required],
            order: [data.order || 0],
        });
    }

    onSubmit(): void {
        if (this.chapterForm.valid) {
            this.dialogRef.close(this.chapterForm.value);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
