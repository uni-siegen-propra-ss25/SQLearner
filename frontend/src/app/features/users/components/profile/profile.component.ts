import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../users/models/user.model';
import { AuthService } from '../../../auth/services/auth.service';
import { Role } from '../../../users/models/role.model';
import { TranslateService } from '@ngx-translate/core';

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

    constructor(
        private authService: AuthService,
        private dialogRef: MatDialogRef<ProfileComponent>,
        private translate: TranslateService,
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
        return new Date(this.user.createdAt).toLocaleDateString(
            this.translate.currentLang === 'de' ? 'de-DE' : 'en-GB',
        );
    }

    /**
     * Handles the logout action and closes the dialog
     */
    logout(): void {
        this.authService.logout();
        this.dialogRef.close();
    }
}
