import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export type UserRole = 'student' | 'tutor' | 'admin';

export interface NavigationItem {
  icon: string;
  label: string;
  route: string;
  active?: boolean;
  requiredRoles?: UserRole[];
}

@Component({
  selector: 'app-navigation-rail',
  templateUrl: './navigation-rail.component.html',
  styleUrls: ['./navigation-rail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavigationRailComponent {
  @Input() items: NavigationItem[] = [];
  @Input() logoUrl: string = '';
  @Input() logoAlt: string = 'Logo';
  @Input() userRole: UserRole | null = null;

  @Output() itemSelected = new EventEmitter<NavigationItem>();
  @Output() darkModeChanged = new EventEmitter<boolean>();
  @Output() languageChanged = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();
  
  isDarkMode = false;
  
  get filteredItems(): NavigationItem[] {
    return this.items.filter(item => 
      !item.requiredRoles || 
      !this.userRole || 
      item.requiredRoles.includes(this.userRole)
    );
  }
  
  onItemClick(item: NavigationItem): void {
    this.itemSelected.emit(item);
  }
  
  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    this.darkModeChanged.emit(this.isDarkMode);
  }

  onLogout(): void {
    this.logout.emit(); 
  }

  onLanguageChange(language: string): void {
    this.languageChanged.emit(language);
  }
}
