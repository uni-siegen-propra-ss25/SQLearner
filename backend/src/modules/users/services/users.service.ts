import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { RegisterCredentialsDto } from 'src/modules/auth/models/register-credentials.dto';

/**
 * UsersService handles database operations related to the User model.
 */
@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {}

    /**
     * Finds a user by their email address.
     * @param email The email to look up
     * @returns The full user record (including password), or null if not found
     */
    async getUserByEmail(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { email } });
    }

    /**
     * Retrieves a user by ID, throwing if they do not exist.
     * @param id The user’s ID
     * @returns The user without the password field
     */
    async getUserById(id: number): Promise<Omit<User, 'password'>> {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, ...result } = user;
        return result;
    }

    /**
     * Creates a new user record, hashing the provided password.
     * @param dto Data transfer object containing user registration fields
     * @returns The created user without the password field
     */
    async createUser(dto: RegisterCredentialsDto): Promise<number> {
        const saltRounds = parseInt(
            this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10',
            10,
        );
        const hashed = await bcrypt.hash(dto.password, saltRounds);
        const user = await this.prisma.user.create({
            data: {
                matriculationNumber: dto.matriculationNumber,
                email: dto.email,
                password: hashed,
                firstName: dto.firstName,
                lastName: dto.lastName,
                role: dto.role,
            },
        });

        // Exclude password before returning
        const { password, ...result } = user;
        return result;
    }
}
