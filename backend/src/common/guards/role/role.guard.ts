import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * RolesGuard checks for @Roles() metadata on route handlers
 * and compares it to `request.user.role`. ADMIN always has access.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    /**
     * Determines whether the current request's user has the required roles.
     * @param context ExecutionContext provided by Nest
     * @returns boolean true if access is allowed
     * @throws ForbiddenException if role is insufficient
     */
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());

        // If no roles are required, allow access (route is public or unprotected)
        if (!requiredRoles || requiredRoles.length === 0) {
            return true; // No roles specified = public route
        }

        const { user } = context.switchToHttp().getRequest(); // Get the user object from the request (injected by JwtStrategy)

        // If the user is not present or has no matching role, deny access
        if (!user || (!requiredRoles.includes(user.role) && user.role !== 'ADMIN')) {
            // easier then checking for all roles @Roles('SELLER', 'ADMIN')
            throw new ForbiddenException('Access denied: insufficient role');
        }

        return true; // Role is valid → allow access
    }
}
