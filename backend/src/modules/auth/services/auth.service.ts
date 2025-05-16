import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/services/users.service';
import { JwtPayload } from '../models/jwt-payload.dto';
import { LoginResponseDto } from '../models/login-response.dto';
import { RegisterUserDto } from '../models/register-credentials.dto';
import * as bcrypt from 'bcrypt';

/**
 * AuthService is responsible for user signup, signin and JWT token generation.
 */
@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Registers a new user by delegating creation logic to UsersService.
     * @param dto RegisterUserDto containing user registration data.
     * @returns Promise resolving to the created user (without password field).
     */
    async signUp(dto: RegisterUserDto): Promise<number> {
        return this.usersService.createUser(dto);
    }

    /**
     * Validates a user's credentials.
     * @param email User's email.
     * @param password Plain-text password.
     * @returns The user object without password if valid, otherwise null.
     */
    async validateUser(email: string, password: string) {
        const user = await this.usersService.getUserByEmail(email);
        if (!user) {
            throw new BadRequestException('Invalid credentials');
        }

        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            throw new BadRequestException('Invalid credentials');
        }

        // Exclude the password field from the returned user object
        const { password: _, ...result } = user;
        return result;
    }

    /**
     * Signs in a user by verifying credentials and returning a JWT.
     * @param dto Object containing email and password.
     * @returns LoginResponseDto including accessToken and user info.
     * @throws UnauthorizedException if credentials are invalid.
     */
    async signIn(dto: { email: string; password: string }): Promise<LoginResponseDto> {
        const user = await this.validateUser(dto.email, dto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            username: `${user.firstName} ${user.lastName}`,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
        });

        return {
            accessToken,
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };
    }
}
