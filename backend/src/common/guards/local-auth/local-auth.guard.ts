import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard uses Passport's 'local' strategy to validate user credentials
 * and populate `request.user` for the login endpoint.
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') { }
