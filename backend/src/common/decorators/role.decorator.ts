import { SetMetadata } from '@nestjs/common';

/**
 * Role decorator that assigns role-based access control to route handlers.
 * Used in combination with RolesGuard to protect routes based on user roles.
 *
 * @example
 * ```typescript
 * @Roles('ADMIN', 'TUTOR')
 * @Get('users')
 * getUsers() {
 *   // Only accessible by admins and tutors
 * }
 * ```
 *
 * @param roles The roles that are allowed to access the decorated route or method
 * @returns A metadata decorator containing the roles information
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
