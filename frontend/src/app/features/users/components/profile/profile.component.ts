import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../users/models/user.model';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
    user: User | null = null;

    constructor(
        private authService: AuthService,
        private dialogRef: MatDialogRef<ProfileComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { user: User },
    ) {
        this.user = data.user;
    }

    logout() {
        this.authService.logout();
        this.dialogRef.close();
    }
}
