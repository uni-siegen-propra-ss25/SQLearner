import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../features/auth/services/auth.service';
import { ProfileComponent } from '../../../features/users/components/profile/profile.component';
import { Role } from '../../../features/users/models/role.model';
import { TranslateService } from '@ngx-translate/core';
import { DockerService } from '../../../features/exercises/services/docker.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    @Input() logoAlt: string = 'Logo';
    @Input() userRole: Role | null = null;
    @Input() isDarkTheme: boolean = false;

    @Output() itemSelected = new EventEmitter<NavigationItem>();
    @Output() languageChanged = new EventEmitter<string>();
    @Output() logStatusChanged = new EventEmitter<void>();
    @Output() themeChanged = new EventEmitter<boolean>();

    currentLang = 'de';

    constructor(
        private router: Router,
        private dialog: MatDialog,
        private authService: AuthService,
        private translate: TranslateService,
        private dockerService: DockerService,
        private snackBar: MatSnackBar,
    ) {
        const savedLang = localStorage.getItem('language') || 'de';
        this.currentLang = savedLang;
    }

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

    // Helper to check if container is initializing (global window property set by QueryExerciseComponent)
    private isContainerInitializing(): boolean {
        // This assumes QueryExerciseComponent sets window["containerInitializing"]
        return (window as any)["containerInitializing"] === true;
    }

    onItemClick(item: NavigationItem): void {
        if (this.isContainerInitializing()) {
            this.snackBar.open('Please wait, the environment is being prepared...', 'Close', { duration: 3000 });
            return;
        }
        this.itemSelected.emit(item);
    }

    onLogStatusChanged(): void {
        if (this.userRole) {
            this.logStatusChanged.emit();
        } else {
            this.router.navigate(['/auth/login']);
        }
    }

    onLanguageChange(language: string): void {
        this.currentLang = language;
        this.translate.use(language);
        localStorage.setItem('language', language);
        this.languageChanged.emit(language);
    }

    toggleTheme(): void {
        this.themeChanged.emit(!this.isDarkTheme);
    }

    logout(): void {
        if (this.isContainerInitializing()) {
            this.snackBar.open('Please wait, the environment is being prepared...', 'Close', { duration: 3000 });
            return;
        }
        // Удаляем контейнер, если есть
        const containerId = sessionStorage.getItem('activeContainerId');
        if (containerId) {
            this.dockerService.deleteContainer(containerId).subscribe({
                next: () => {
                    sessionStorage.removeItem('activeContainerId');
                    this.authService.logout();
                    this.router.navigate(['/auth/login']);
                },
                error: () => {
                    sessionStorage.removeItem('activeContainerId');
                    this.authService.logout();
                    this.router.navigate(['/auth/login']);
                }
            });
        } else {
            this.authService.logout();
            this.router.navigate(['/auth/login']);
        }
    }
}
