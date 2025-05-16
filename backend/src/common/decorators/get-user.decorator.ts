import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * GetUser decorator provides `request.user` to controller methods.
 */
export const GetUser = createParamDecorator(
  /**
   * @param _data any data passed to the decorator (unused)
   * @param ctx ExecutionContext from Nest
   * @returns the `user` object attached by an AuthGuard
   */
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);