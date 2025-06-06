import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Guard to protect routes based on user role.
 */
@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
    constructor(
        private auth: AuthService,
        private router: Router,
    ) {}

    canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
        const expectedRoles: string[] = route.data['roles'];
        const userRole = this.auth.getUserRole();

        if (!expectedRoles || expectedRoles.length === 0) {
            return true; // No roles defined, allow access -> public route
        }

        if (!userRole || !expectedRoles.includes(userRole)) {
            // User does not have the required role
            // Redirect to forbidden page
            this.router.navigate(['/forbidden']);
            return false;
        }

        return true;
    }
}
