import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * GetUser decorator provides `request.user` to controller methods.
 * If a property key is provided, returns that specific property.
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
