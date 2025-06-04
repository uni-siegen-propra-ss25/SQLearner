import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Authentication guard for validating email/password credentials.
 * Implements Passport's local strategy for username/password authentication.
 *
 * The guard:
 * - Extracts credentials from request body
 * - Validates them using AuthService.validateUser()
 * - Attaches the validated user to the request as `request.user`
 *
 * Typically used only for the login endpoint to authenticate initial user credentials.
 *
 * @example
 * @UseGuards(LocalAuthGuard)
 * @Post('login')
 * async login(@Request() req) {
 *   // req.user contains validated user
 *   return this.authService.login(req.user);
 * }
 *
 * @throws UnauthorizedException if credentials are invalid
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
