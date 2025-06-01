import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

/**
 * Guard for role-based access control (RBAC).
 * Validates that the authenticated user has the required role to access a route.
 * Works in conjunction with the @Roles() decorator.
 *
 * Features:
 * - Checks route's required roles against user's role
 * - ADMIN role always has access to all routes
 * - No roles = public route
 *
 * @example
 * // Single role
 * @Roles('ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Delete('users/:id')
 * deleteUser() {
 *   // Only admins can access
 * }
 *
 * // Multiple roles
 * @Roles('ADMIN', 'TUTOR')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('users')
 * getUsers() {
 *   // Admins and tutors can access
 * }
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    /**
     * Determines if the current user has permission to access the route.
     * Checks the roles required by @Roles() decorator against user's role.
     *
     * @param context Execution context containing the request and handler info
     * @returns True if access is allowed, false otherwise
     * @throws ForbiddenException if user's role is insufficient
     */
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());

        // If no roles are required, allow access (route is public or unprotected)
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // If the user is not present or has no matching role (and is not ADMIN), deny access
        if (!user || (!requiredRoles.includes(user.role) && user.role !== Role.ADMIN)) {
            throw new ForbiddenException('Access denied: insufficient role');
        }

        return true;
    }
}
