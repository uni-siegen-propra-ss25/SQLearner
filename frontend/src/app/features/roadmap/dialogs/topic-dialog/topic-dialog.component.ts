import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Topic } from '../../models/topic.model';

@Component({
    selector: 'app-topic-dialog',
    templateUrl: './topic-dialog.component.html',
    styleUrls: ['./topic-dialog.component.scss'],
})
export class TopicDialogComponent {
    topicForm: FormGroup;
    isEditing: boolean;

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<TopicDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: Partial<Topic>,
    ) {
        this.isEditing = !!data.id;
        // the chapterId is inside the data for the topicDto creation
        this.topicForm = this.fb.group({
            title: [data.title || '', Validators.required],
            description: [data.description || ''],
            chapterId: [data.chapterId],
            order: [data.order || 0],
        });
    }

    onSubmit(): void {
        if (this.topicForm.valid) {
            this.dialogRef.close(this.topicForm.value);
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
