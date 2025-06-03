import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/features/auth/services/auth.service';
import { Role } from 'app/features/users/models/role.model';

@Component({
  selector: 'app-welcome-redirect',
  template: '',
})
export class WelcomeRedirectComponent implements OnInit {
  constructor(private authService: AuthService, private router: Router) {}

ngOnInit(): void {
  const role = this.authService.getUserRole();

  if (role === Role.STUDENT) {
    this.router.navigate(['/welcome/student']);
  } else if (role === Role.TUTOR) {
    this.router.navigate(['/welcome/tutor']);
  } else {
    // Kein eingeloggter User -> Standard-Willkommensseite
    this.router.navigate(['/welcome/default']);
  }
}
}
