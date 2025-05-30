import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationItem } from './shared/components/navigation-rail/navigation-rail.component';
import { AuthService } from './features/auth/services/auth.service';
import { Subscription } from 'rxjs';
import { Role } from './features/users/models/role.model';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
    isDarkMode = false;
    logoUrl = 'assets/icons/logo_SQLearner.svg';
    logoAlt = 'SQLearner Logo';

    currentUserRole: Role | null = null;
    private userSubscription: Subscription | null = null;

    private readonly studentItems: NavigationItem[] = [
        { icon: 'timeline', label: 'Roadmap', route: '/roadmap', requiredRoles: [Role.STUDENT] },
        {
            icon: 'analytics',
            label: 'Fortschritt',
            route: '/progress',
            requiredRoles: [Role.STUDENT],
        },
    ];

    private readonly tutorItems: NavigationItem[] = [
        { icon: 'groups', label: 'Nutzerverwaltung', route: '/users', requiredRoles: [Role.TUTOR] },
        { icon: 'timeline', label: 'Roadmap', route: '/roadmap', requiredRoles: [Role.TUTOR] },
        {
            icon: 'storage',
            label: 'Datenbanken',
            route: '/databases',
            requiredRoles: [Role.TUTOR],
        },
    ];

    private readonly adminItems: NavigationItem[] = [
        {
            icon: 'manage_accounts',
            label: 'Nutzerverwaltung',
            route: '/users',
            requiredRoles: [Role.ADMIN],
        },
        {
            icon: 'settings',
            label: 'Einstellungen',
            route: '/settings',
            requiredRoles: [Role.ADMIN],
        },
        {
            icon: 'vpn_key',
            label: 'API-Key',
            route: '/admin/api-key',
            requiredRoles: [Role.ADMIN],
        },
    ];

    private readonly commonItems: NavigationItem[] = [
        { icon: 'home', label: 'Dashboard', route: '/welcome' },
    ];

    constructor(
        private readonly authService: AuthService,
        private readonly router: Router,
    ) {}

    ngOnInit(): void {
        // Subscribe to user changes
        this.userSubscription = this.authService.user$.subscribe((user) => {
            this.currentUserRole = user?.role || null;
        });
    }

    ngOnDestroy(): void {
        // Unsubscribe from user changes
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
        }
    }

    get currentUserNavigationItems(): NavigationItem[] {
        if (!this.currentUserRole) {
            return [...this.commonItems]; // Return only common items for users with no role
        }

        let items = [...this.commonItems];

        switch (this.currentUserRole) {
            case Role.STUDENT:
                items = [...items, ...this.studentItems];
                break;
            case Role.TUTOR:
                items = [...items, ...this.tutorItems];
                break;
            case Role.ADMIN:
                items = [...items, ...this.adminItems];
                break;
        }

        return items;
    }

    onNavigationItemSelected(item: NavigationItem): void {
        this.router.navigate([item.route]);
    }

    onDarkModeChanged(isDark: boolean): void {
        this.isDarkMode = isDark;
        localStorage.setItem('darkMode', JSON.stringify(isDark));
        this.applyTheme();
    }

    onLanguageChanged(language: string): void {
        localStorage.setItem('language', language); // TODO: Implement language change DE -> EN
        window.location.reload(); // Reload to apply language change
    }

    async onLogStatusChanged(): Promise<void> {
        this.authService.logout();
    }

    private applyTheme(): void {
        document.body.classList.toggle('dark-theme', this.isDarkMode);
    }
}
