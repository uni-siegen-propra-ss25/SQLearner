import { Injectable, NotFoundException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/services/users.service';
import { JwtPayload } from './models/jwt-payload.dto';
import { Role } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private usersService: UsersService,
    ) {
        const secret = config.getOrThrow<string>('JWT_SECRET');

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: JwtPayload) {
        const user = await this.usersService.getUserById(payload.sub);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Ensure role is properly converted to Role enum
        const role = user.role as Role;
    
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: role,
            matriculationNumber: user.matriculationNumber,
        };
    }
}
