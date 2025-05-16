import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator sets the required roles for a route handler.
 * @param roles list of roles allowed to access the route
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles); // grabs the roles from the request and sets them as metadata
