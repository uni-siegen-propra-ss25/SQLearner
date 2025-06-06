import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-api-key-dialog',
  template: `
    <h2 mat-dialog-title>OpenAI API-Key {{ data.apiKey ? 'ändern' : 'hinzufügen' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>API-Key</mat-label>
          <input
            matInput
            formControlName="apiKey"
            type="password"
            autocomplete="off"
            placeholder="sk-..."
          >
          <mat-error *ngIf="form.get('apiKey')?.hasError('required')">
            API-Key ist erforderlich
          </mat-error>
          <mat-error *ngIf="form.get('apiKey')?.hasError('pattern')">
            API-Key muss mit 'sk-' beginnen
          </mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="cancel()">Abbrechen</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          Speichern
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    mat-dialog-content {
      min-width: 400px;
    }
  `]
})
export class ApiKeyDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ApiKeyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { apiKey: string }
  ) {
    this.form = this.fb.group({
      apiKey: [data.apiKey, [
        Validators.required,
        Validators.pattern(/^sk-[A-Za-z0-9]+$/)
      ]]
    });
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
