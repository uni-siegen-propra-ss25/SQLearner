import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Auth Module handles all authentication-related functionality.
 *
 * This module integrates JWT authentication, Passport.js strategies, and user authentication flows.
 * It provides services for user registration, login, and JWT token management.
 *
 * @module AuthModule
 */
@Module({
    imports: [
        UsersModule,
        PassportModule,
        ConfigModule.forRoot({ isGlobal: true }), // .env can be used globally
        JwtModule.registerAsync({
            inject: [ConfigService],

            // settings from .env
            useFactory: async (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '1h' },
            }),
        }),
    ],
    providers: [AuthService, JwtStrategy, LocalStrategy],
    controllers: [AuthController],
})
export class AuthModule {}
