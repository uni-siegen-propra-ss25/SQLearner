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
  templateUrl: './user-update-dialog.component.html',
  styleUrls: ['./user-update-dialog.component.scss']
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
