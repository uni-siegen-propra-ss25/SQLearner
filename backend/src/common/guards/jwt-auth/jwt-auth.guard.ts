import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Authentication guard that validates JWT tokens in request headers.
 * Uses Passport's JWT strategy to authenticate and authorize requests.
 *
 * The guard:
 * - Extracts the JWT token from the Authorization header
 * - Validates the token's signature and expiration
 * - Attaches the decoded user to the request as `request.user`
 *
 * @example
 * // Protect a single route
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile() {
 *   // Only accessible with valid JWT
 * }
 *
 * // Protect an entire controller
 * @UseGuards(JwtAuthGuard)
 * @Controller('users')
 * export class UsersController {
 *   // All routes require JWT
 * }
 *
 * @throws UnauthorizedException if token is missing, expired, or invalid
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
