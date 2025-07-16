import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-api-key-dialog',
    templateUrl: './api-key-dialog.component.html',
    styleUrls: ['./api-key-dialog.component.scss'],
})
export class ApiKeyDialogComponent {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<ApiKeyDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { apiKey: string },
        private translate: TranslateService,
    ) {
        this.form = this.fb.group({
            apiKey: [data.apiKey, [Validators.required, Validators.pattern(/^sk-[A-Za-z0-9_-]+$/)]],
        });
    }

    getDialogTitle(): string {
        const key = this.data.apiKey ? 'SETTINGS.DIALOG_TITLE_CHANGE' : 'SETTINGS.DIALOG_TITLE_ADD';
        return this.translate.instant(key);
    }

    save() {
        if (this.form.valid) {
            this.dialogRef.close(this.form.get('apiKey')?.value);
        }
    }

    cancel() {
        this.dialogRef.close();
    }
}
