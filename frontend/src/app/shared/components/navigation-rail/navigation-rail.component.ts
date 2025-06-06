import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../features/auth/services/auth.service';
import { ProfileComponent } from '../../../features/users/components/profile/profile.component';
import { Role } from '../../../features/users/models/role.model';

export interface NavigationItem {
    icon: string;
    label: string;
    route: string;
    active?: boolean;
    requiredRoles?: Role[];
}

@Component({
    selector: 'app-navigation-rail',
    templateUrl: './navigation-rail.component.html',
    styleUrls: ['./navigation-rail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationRailComponent {
    @Input() items: NavigationItem[] = [];
    @Input() logoUrl: string = '';
    @Input() logoAlt: string = 'Logo';
    @Input() userRole: Role | null = null;

    @Output() itemSelected = new EventEmitter<NavigationItem>();
    @Output() darkModeChanged = new EventEmitter<boolean>();
    @Output() languageChanged = new EventEmitter<string>();
    @Output() logStatusChanged = new EventEmitter<void>();

    isDarkMode = false;

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private authService: AuthService,
    ) {}
    openProfile(): void {
        const user = this.authService.getUserFromToken();
        this.dialog.open(ProfileComponent, {
            data: { user },
            width: '400px',
            autoFocus: false,
        });
    }

    get filteredItems(): NavigationItem[] {
        return this.items.filter(
            (item) =>
                !item.requiredRoles || !this.userRole || item.requiredRoles.includes(this.userRole),
        );
    }

    onItemClick(item: NavigationItem): void {
        this.itemSelected.emit(item);
    }

    toggleDarkMode(): void {
        this.isDarkMode = !this.isDarkMode;
        this.darkModeChanged.emit(this.isDarkMode);
    }

    onLogStatusChanged(): void {
        if (this.userRole) {
            this.logStatusChanged.emit();
        } else {
            this.router.navigate(['/auth/login']);
        }
    }

    onLanguageChange(language: string): void {
        this.languageChanged.emit(language);
    }
}
