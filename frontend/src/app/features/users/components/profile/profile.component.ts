import { Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../users/models/user.model';
import { AuthService } from '../../../auth/services/auth.service';
import { Role } from '../../../users/models/role.model';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
/**
 * ProfileComponent displays the user's profile information in a dialog.
 * Shows personal information and allows the user to logout.
 */
export class ProfileComponent implements OnInit {
    /** The current user's profile data */
    user: User | null = null;

    /** Role display mapping */
    roleDisplayNames = {
        [Role.ADMIN]: 'Administrator',
        [Role.TUTOR]: 'Tutor',
        [Role.STUDENT]: 'Student',
    };

    constructor(
        private authService: AuthService,
        private dialogRef: MatDialogRef<ProfileComponent>,
    ) {}

    /**
     * Initializes the component by loading the current user's data
     */
    ngOnInit(): void {
        this.user = this.authService.getUserFromToken();
        if (!this.user) {
            console.error('User data not found in token');
            this.dialogRef.close();
        }
    }

    /**
     * Gets the formatted registration date string
     */
    getRegistrationDate(): string {
        if (!this.user?.createdAt) return '-';
        return new Date(this.user.createdAt).toLocaleDateString('de-DE');
    }

    /**
     * Gets the display name for a role
     */
    getRoleDisplayName(role: string): string {
        return this.roleDisplayNames[role as Role] || role;
    }

    /**
     * Handles the logout action and closes the dialog
     */
    logout(): void {
        this.authService.logout();
        this.dialogRef.close();
    }
}
