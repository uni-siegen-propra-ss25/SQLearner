import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/modules/users/services/users.service';
import { JwtPayload } from '../models/jwt-payload.dto';
import { LoginResponseDto } from '../models/login-response.dto';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/modules/users/models/create-user.dto';
import { User } from '@prisma/client';
import { LoginCredentialsDto } from '../models/login-credentials.dto';

/**
 * AuthService is responsible for user signup, signin and JWT token generation.
 */
@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Registers a new user by delegating creation logic to UsersService.
     * @param dto CreateUserDto containing user registration data.
     * @returns Promise resolving to the created user (without password field).
     */
    async signUp(dto: CreateUserDto): Promise<number> {
        return this.usersService.createUser(dto);
    }

    /**
     * Signs in a user by verifying credentials and returning a JWT.
     * @param dto Object containing email and password.
     * @returns LoginResponseDto including accessToken and user info.
     * @throws UnauthorizedException if credentials are invalid.
     */
    async signIn(email: string, password: string): Promise<LoginResponseDto> {
        const user = await this.usersService.getUserByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordValid = await bcrypt.compare(password, user.password);

        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: JwtPayload = {
            sub: user.id,
            email: user.email,
            username: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            matriculationNumber: user.matriculationNumber ?? '',
        };
        const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN')?.trim() || '1h';

        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: expiresIn,
        });

        return {
            accessToken,
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };
    }

    /**
     * Validates a user's credentials.
     * @param email User's email.
     * @param password Plain-text password.
     * @returns The user object without password if valid, otherwise null.
     */
    async validateUser(email: string, password: string): Promise<Omit<User, 'password'>> {
        const user = await this.usersService.getUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        // Exclude the password field from the returned user object
        const { password: _, ...result } = user;
        return result as Omit<User, 'password'>;
    }
}
