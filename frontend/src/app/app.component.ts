import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationItem, UserRole } from './shared/components/navigation-rail/navigation-rail.component';
import { AuthService } from './features/auth/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isDarkMode = false;
  logoUrl = 'assets/icons/logo_SQLearner.svg';
  logoAlt = 'SQLearner Logo';
  currentUserRole: UserRole | null = null;

  private readonly studentItems: NavigationItem[] = [
    { icon: 'school', label: 'Lernen', route: '/learn', requiredRoles: ['student'] },
    { icon: 'assignment', label: 'Aufgaben', route: '/assignments', requiredRoles: ['student'] },
    { icon: 'analytics', label: 'Fortschritt', route: '/progress', requiredRoles: ['student'] }
  ];

  private readonly tutorItems: NavigationItem[] = [
    { icon: 'groups', label: 'Studenten', route: '/students', requiredRoles: ['tutor'] },
    { icon: 'assignment_turned_in', label: 'Bewertungen', route: '/grading', requiredRoles: ['tutor'] }
  ];

  private readonly adminItems: NavigationItem[] = [
    { icon: 'admin_panel_settings', label: 'Administration', route: '/admin', requiredRoles: ['admin'] },
    { icon: 'settings', label: 'Einstellungen', route: '/settings', requiredRoles: ['admin'] }
  ];

  private readonly commonItems: NavigationItem[] = [
    { icon: 'home', label: 'Willkommen', route: '/' }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to auth state changes
    this.authService.isLoggedIn$.subscribe(() => {
      this.updateUserRole();
    });

    // Initialize dark mode from localStorage if available
    /*
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      this.isDarkMode = JSON.parse(savedDarkMode);
      this.applyTheme();
    }
    */
  }

  get currentUserNavigationItems(): NavigationItem[] {
    if (!this.currentUserRole) {
      return [...this.commonItems]; // Return only common items for users with no role
    }

    let items = [...this.commonItems];
    
    switch (this.currentUserRole) {
      case 'student':
        items = [...items, ...this.studentItems];
        break;
      case 'tutor':
        items = [...items, ...this.tutorItems];
        break;
      case 'admin':
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
    localStorage.setItem('language', language);
    window.location.reload(); // Reload to apply language change
  }

  async onLogout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  private updateUserRole(): void {
    this.currentUserRole = this.authService.getUserRole() as UserRole | null;
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }
}
