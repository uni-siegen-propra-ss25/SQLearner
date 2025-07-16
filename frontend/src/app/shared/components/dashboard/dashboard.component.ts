import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth.service';
import { User } from '../../../features/users/models/user.model';
import { Role } from '../../../features/users/models/role.model';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
    currentUser: User | null = null;
    userRole: Role | null = null;
    Role = Role; // Expose Role enum to template

    constructor(
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        this.loadCurrentUser();
    }

    private loadCurrentUser(): void {
        this.authService.user$.subscribe((user: User | null) => {
            this.currentUser = user;
            this.userRole = user?.role || null;
        });
    }

    // Check permissions
    canManageHints(): boolean {
        return this.userRole === Role.TUTOR || this.userRole === Role.ADMIN;
    }

    canManageTodos(): boolean {
        return this.userRole === Role.TUTOR || this.userRole === Role.ADMIN;
    }
}
