import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * A parameter decorator to extract the authenticated user or user properties from the request.
 * The user must be present in `request.user`, typically set by an authentication guard.
 *
 * @example
 * ```typescript
 * // Get the entire user object
 * @Get('profile')
 * getProfile(@GetUser() user) {
 *   return user;
 * }
 *
 * // Get a specific user property
 * @Get('email')
 * getUserEmail(@GetUser('email') email: string) {
 *   return email;
 * }
 * ```
 *
 * @param data Optional key to extract a specific property from the user object
 * @param ctx The execution context from which to extract the request and user
 * @returns The full user object or the specified user property
 */
export const GetUser = createParamDecorator(
    /**
     * @param data property key to extract from user object (optional)
     * @param ctx ExecutionContext from Nest
     * @returns the user object or specific property if key provided
     */
    (data: string | undefined, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        if (!user) {
            return undefined;
        }

        // If a property key is provided, return that specific property
        if (data) {
            return user[data];
        }

        // Otherwise return the whole user object
        return user;
    },
);