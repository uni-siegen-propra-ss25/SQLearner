import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/features/auth/services/auth.service';
import { Role } from 'app/features/users/models/role.model';

@Component({
  selector: 'app-welcome-redirect',
  template: '',
})
export class WelcomeRedirectComponent implements OnInit {
  // Konstruktor mit AuthService zur Rollenabfrage und Router für Navigation
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Rolle des Benutzers ermitteln (student, tutor oder nicht eingeloggt)
    const role = this.authService.getUserRole();

    // Weiterleitung zur passenden Willkommensseite
    if (role === Role.STUDENT) {
      this.router.navigate(['/welcome/student']);
    } else if (role === Role.TUTOR) {
      this.router.navigate(['/welcome/tutor']);
    } else {
      // Fallback bei fehlender Rolle – Standardseite
      this.router.navigate(['/welcome/default']);
    }
  }
}

