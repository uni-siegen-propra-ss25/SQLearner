import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Role } from '../../models/role.model';
import { User } from '../../models/user.model';

interface DialogData {
  user: User;
  availableRoles: Role[];
}

@Component({
  selector: 'app-user-update-dialog',
  template: `
    <h2 mat-dialog-title>Nutzer bearbeiten</h2>
    
    <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Vorname</mat-label>
            <input matInput formControlName="firstName" required>
            <mat-error *ngIf="userForm.get('firstName')?.hasError('required')">
              Vorname ist erforderlich
            </mat-error>
          </mat-form-field>
  
          <mat-form-field appearance="outline">
            <mat-label>Nachname</mat-label>
            <input matInput formControlName="lastName" required>
            <mat-error *ngIf="userForm.get('lastName')?.hasError('required')">
              Nachname ist erforderlich
            </mat-error>
          </mat-form-field>
        </div>
  
        <mat-form-field appearance="outline">
          <mat-label>E-Mail</mat-label>
          <input matInput formControlName="email" required type="email">
          <mat-error *ngIf="userForm.get('email')?.hasError('required')">
            E-Mail ist erforderlich
          </mat-error>
          <mat-error *ngIf="userForm.get('email')?.hasError('email')">
            Ungültige E-Mail-Adresse
          </mat-error>
        </mat-form-field>
  
        <mat-form-field appearance="outline">
          <mat-label>Rolle</mat-label>
          <mat-select formControlName="role" required>
            <mat-option *ngFor="let role of data.availableRoles" [value]="role">
              {{role}}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="userForm.get('role')?.hasError('required')">
            Rolle ist erforderlich
          </mat-error>
        </mat-form-field>
  
        <mat-form-field appearance="outline" *ngIf="isStudent">
          <mat-label>Matrikelnummer</mat-label>
          <input matInput formControlName="matriculationNumber">
          <mat-error *ngIf="userForm.get('matriculationNumber')?.hasError('required')">
            Matrikelnummer ist für Studenten erforderlich
          </mat-error>
        </mat-form-field>
  
        <mat-form-field appearance="outline">
          <mat-label>Neues Passwort (optional)</mat-label>
          <input matInput formControlName="password" type="password">
          <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">
            Passwort muss mindestens 8 Zeichen lang sein
          </mat-error>
        </mat-form-field>
      </mat-dialog-content>
  
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Abbrechen</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!userForm.valid">
          Speichern
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .form-row {
      display: flex;
      gap: 16px;
    }
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class UserUpdateDialogComponent {
  userForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.userForm = this.fb.group({
      firstName: [data.user.firstName, Validators.required],
      lastName: [data.user.lastName, Validators.required],
      email: [data.user.email, [Validators.required, Validators.email]],
      role: [data.user.role, Validators.required],
      matriculationNumber: [data.user.matriculationNumber || ''],
      password: ['', [Validators.minLength(8)]]
    });

    // Update matriculationNumber validators based on role
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      const matCtrl = this.userForm.get('matriculationNumber');
      if (role === Role.STUDENT) {
        matCtrl?.setValidators([Validators.required]);
      } else {
        matCtrl?.clearValidators();
        matCtrl?.setValue('');
      }
      matCtrl?.updateValueAndValidity();
    });
  }

  get isStudent(): boolean {
    return this.userForm.get('role')?.value === Role.STUDENT;
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      // Only include password if it was changed
      if (!formValue.password) {
        delete formValue.password;
      }
      this.dialogRef.close({
        ...formValue,
        id: this.data.user.id
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
