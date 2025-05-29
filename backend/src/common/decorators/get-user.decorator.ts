import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * GetUser decorator provides `request.user` to controller methods.
 */
export const GetUser = createParamDecorator(
    /**
     * @param data any data passed to the decorator - can be used to extract specific user properties
     * @param ctx ExecutionContext from Nest
     * @returns the `user` object attached by an AuthGuard, or a specific property if data is provided
     */
    (data: string | undefined, ctx: ExecutionContext) => {
        const req = ctx.switchToHttp().getRequest();
        const user = req.user;
        
        // If a property name is specified, return that property
        if (data) {
            return user[data];
        }
        
        // Otherwise return the entire user object
        return user;
    },
);
