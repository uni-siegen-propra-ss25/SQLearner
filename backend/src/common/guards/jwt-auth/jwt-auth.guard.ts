import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard uses Passport's 'jwt' strategy to validate the JWT
 * and attach the decoded user to `request.user`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
